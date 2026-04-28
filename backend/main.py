import os
import time
import uuid
import json
import pandas as pd
from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import AuditRecord, create_audit_record, AnalyzeRequest, ReportRequest
import jinja2
from weasyprint import HTML
from fairness_engine import compute_metrics
from firebase_config import db
from detection import detect_sensitive_attributes
import traceback
from google import genai

app = FastAPI(title="Bias Audit Platform API")

# Setup CORS (Allow all origins for now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Placeholder router structure
api_router = APIRouter()

@api_router.post("/upload/dataset")
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Empty filename.")
        
    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported.")
        
    dataset_id = str(uuid.uuid4())
    tmp_path = f"/tmp/{dataset_id}.csv"
    
    try:
        # Read the uploaded file into a pandas DataFrame
        if filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
            
        # Ensure /tmp directory exists
        os.makedirs("/tmp", exist_ok=True)
            
        # Save to /tmp/{dataset_id}.csv
        df.to_csv(tmp_path, index=False)
        
        # Infer column types
        dtypes_inferred = {}
        for col in df.columns:
            if pd.api.types.is_bool_dtype(df[col]):
                dtypes_inferred[col] = "boolean"
            elif pd.api.types.is_numeric_dtype(df[col]):
                dtypes_inferred[col] = "numerical"
            else:
                dtypes_inferred[col] = "categorical"
                
        # First 5 rows for preview
        # to_json automatically handles NaNs and converts them to valid JSON nulls
        preview_json = df.head(5).to_json(orient="records")
        preview_data = json.loads(preview_json)
        
        # Execute Column Detection
        detected_res = detect_sensitive_attributes(df)
        detected_sensitive_attrs = detected_res["detected"]
        
        import re
        outcome_keywords = ["income", "label", "target", "outcome", "class", "result", "approved", "hired", "defaulted", "churned", "fraud", "readmitted", "survived", "diagnosis", "y"]
        suggested_outcome_col = ""
        for col in df.columns:
            clean_col = str(col).lower().replace('-', ' ').replace('_', ' ')
            if any(re.search(rf'\b{kw}\b', clean_col) for kw in outcome_keywords) or clean_col in outcome_keywords:
                suggested_outcome_col = col
                break
        
        unique_values = {}
        for col in df.columns:
            if df[col].nunique() <= 15:
                unique_values[col] = [str(v) for v in df[col].dropna().unique().tolist()[:15]]
            else:
                unique_values[col] = []
        
        return {
            "dataset_id": dataset_id,
            "columns": list(df.columns),
            "dtypes": dtypes_inferred,
            "preview": preview_data,
            "detected_sensitive_attrs": detected_sensitive_attrs,
            "suggested_outcome_col": suggested_outcome_col,
            "original_filename": filename,
            "unique_values": unique_values
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

def run_analysis(audit_id: str, dataset_id: str, sensitive_attrs: list, outcome_col: str, positive_value: str):
    """Background task to run fairlearn audit constraints and save to Firestore."""
    print(f"analysis started for audit_id: {audit_id}")
    try:
        # 1. Update Firestore status to running
        doc_ref = db.collection("audits").document(audit_id)
        doc_ref.update({"status": "running"})
        
        # 2. Load the dataset
        dataset_path = f"/tmp/{dataset_id}.csv"
        df = pd.read_csv(dataset_path)
        total_records = len(df)
        
        metrics_dict = {}
        severity_dict = {}
        
        # 3. Call compute_metrics() for each sensitive attribute
        for attr in sensitive_attrs:
            result = compute_metrics(df, attr, outcome_col, positive_value)
            metrics_dict[attr] = result
            severity_dict[attr] = result.get("severity", "Unknown")
            
        # Calculate Fairness Score
        score = 100
        has_high_severity = any(s == "High" for s in severity_dict.values())
        has_moderate_severity = any(s == "Moderate" for s in severity_dict.values())
        
        if has_high_severity:
            score -= 30
        if has_moderate_severity:
            score -= 15
            
        for attr, result in metrics_dict.items():
            if "error" not in result:
                di = result.get('disparate_impact_ratio', 1.0)
                dp = abs(result.get('demographic_parity_difference', 0.0))
                if type(di) in (int, float) and di < 0.8:
                    score -= 10
                if type(dp) in (int, float) and dp > 0.1:
                    score -= 5
                    
        score = max(0, int(score))

        # Call Gemini to get an explanation for each attribute
        gemini_explanations = {}
        dataset_desc = ""
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
            
            columns_list = list(df.columns)
            desc_prompt = f"Given these column names from a dataset: {columns_list}. In exactly 2 sentences, describe what this dataset most likely represents and what kind of decisions it might be used to automate. Be specific and plain — no jargon."
            
            max_retries_desc = 3
            retry_count_desc = 0
            success_desc = False
            while retry_count_desc < max_retries_desc and not success_desc:
                try:
                    response_desc = client.models.generate_content(model='gemini-2.5-flash-lite', contents=desc_prompt)
                    dataset_desc = response_desc.text.strip()
                    success_desc = True
                except Exception as e:
                    retry_count_desc += 1
                    if retry_count_desc < max_retries_desc:
                        time.sleep(3)
                    else:
                        dataset_desc = "Dataset automated description is temporarily unavailable due to high API demand."
            
            valid_attrs = []
            metrics_payload_str = ""
            for attr, result in metrics_dict.items():
                if "error" in result:
                    gemini_explanations[attr] = {"summary": "Error in metric computation.", "impact": "", "root_cause": "", "severity": "Unknown", "insight_sentence": ""}
                else:
                    valid_attrs.append(attr)
                    metrics_payload_str += f"\nMetrics for '{attr}':\n"
                    metrics_payload_str += f"- Demographic Parity Difference: {result.get('demographic_parity_difference')}\n"
                    metrics_payload_str += f"- Equalized Odds Difference: {result.get('equalized_odds_difference')}\n"
                    metrics_payload_str += f"- Disparate Impact Ratio: {result.get('disparate_impact_ratio')}\n"
                    metrics_payload_str += f"- Statistical Parity Difference: {result.get('statistical_parity_difference')}\n"
                    metrics_payload_str += f"Group Outcome Rates: {result.get('group_rates')}\n"
                    metrics_payload_str += f"Severity Classification: {result.get('severity')}\n"
                    
            if valid_attrs:
                attr_keys = ', '.join([f"'{a}'" for a in valid_attrs])
                prompt = f"""You are a fairness auditor. Analyze the following bias metrics for multiple sensitive attributes in dataset '{dataset_id}'. 
                Return ONLY a valid JSON object where EACH KEY is the attribute name (e.g., {attr_keys}), and the value is a nested JSON object with exactly these 5 keys: summary (one sentence describing what bias was found), impact (one sentence describing real-world harm), root_cause (one sentence explaining why this bias exists), severity (exactly one word: Low, Moderate, or High), and insight_sentence.
                For each attribute also include a key called insight_sentence — a single punchy sentence (max 25 words) that leads with the most striking number from the analysis, uses bold HTML tags around key words/numbers, and names the specific groups involved. Examples of the EXACT style we expect: 'Males are <b>2.2x more likely</b> to be predicted as earning >50K compared to females with similar qualifications.' or 'White and Asian individuals have <b>higher positive outcome rates</b> than Black and Other racial groups.' The insight_sentence MUST use <b> tags for emphasis. Do NOT wrap the insight_sentence in markdown. Ensure it returns as raw HTML string inside the JSON.
                No markdown, no bullet points, no extra text — only the JSON object.
                {metrics_payload_str}"""
                
                max_retries = 3
                retry_count = 0
                success = False
                
                while retry_count < max_retries and not success:
                    try:
                        response = client.models.generate_content(model='gemini-2.5-flash-lite', contents=prompt)
                        clean_text = response.text.strip()
                        if clean_text.startswith("```json"):
                            clean_text = clean_text[7:]
                        if clean_text.startswith("```"):
                            clean_text = clean_text[3:]
                        if clean_text.endswith("```"):
                            clean_text = clean_text[:-3]
                            
                        parsed_json = json.loads(clean_text)
                        
                        for attr in valid_attrs:
                            if attr in parsed_json:
                                attr_json = parsed_json[attr]
                                gemini_explanations[attr] = {
                                    "summary": attr_json.get("summary", ""),
                                    "impact": attr_json.get("impact", ""),
                                    "root_cause": attr_json.get("root_cause", ""),
                                    "severity": attr_json.get("severity", "Unknown"),
                                    "insight_sentence": attr_json.get("insight_sentence", "")
                                }
                            else:
                                gemini_explanations[attr] = {"summary": "No explanation returned by AI.", "impact": "", "root_cause": "", "severity": "Unknown", "insight_sentence": ""}
                        success = True
                    except Exception as e:
                        if isinstance(e, json.JSONDecodeError):
                            for attr in valid_attrs:
                                gemini_explanations[attr] = {
                                    "summary": f"Failed to parse explanation: {response.text}",
                                    "impact": "",
                                    "root_cause": "",
                                    "severity": "Unknown",
                                    "insight_sentence": ""
                                }
                            success = True
                        else:
                            retry_count += 1
                            print(f"Gemini API error (attempt {retry_count}/{max_retries}): {e}")
                            if retry_count < max_retries:
                                time.sleep(3)
                            else:
                                for attr in valid_attrs:
                                    gemini_explanations[attr] = {
                                        "summary": "AI explanation temporarily unavailable due to high demand. The bias metrics above are still accurate.",
                                        "impact": "",
                                        "root_cause": "",
                                        "severity": "Unknown",
                                        "insight_sentence": ""
                                    }
        else:
            print("GEMINI_API_KEY not found in environment; skipping explanations.")

        # 4 & 5. Update Firestore record
        doc_ref.update({
             "status": "complete",
             "metrics": metrics_dict,
             "severity": severity_dict,
             "gemini_explanation": gemini_explanations,
             "dataset_description": dataset_desc,
             "fairness_score": score,
             "total_records": total_records
        })
        print(f"analysis completed successfully for audit_id: {audit_id}")
        
    except Exception as e:
        print(f"analysis failed for audit_id {audit_id}: {str(e)}")
        traceback.print_exc()
        try:
            doc_ref = db.collection("audits").document(audit_id)
            doc_ref.update({
                "status": "failed",
                "error_message": str(e)
            })
        except Exception as update_err:
            print(f"Failed to update failure status in Firestore: {str(update_err)}")

@api_router.post("/analyze/dataset")
def start_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    dataset_path = f"/tmp/{request.dataset_id}.csv"
    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    try:
        # Validate that outcome_col exists
        # Read only headers for fast checking
        df_cols = pd.read_csv(dataset_path, nrows=0).columns
        if request.outcome_col not in df_cols:
            raise HTTPException(status_code=400, detail=f"outcome_col '{request.outcome_col}' not found in dataset")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")
        
    # Create audit record
    audit_record = AuditRecord(
        user_session_id="anonymous",
        dataset_name=request.original_filename,
        sensitive_attrs=request.sensitive_attrs,
        outcome_col=request.outcome_col,
        positive_value=request.positive_value,
        status="pending"
    )
    
    audit_id = create_audit_record(audit_record)
    
    # Kick off background task
    background_tasks.add_task(
        run_analysis,
        audit_id,
        request.dataset_id,
        request.sensitive_attrs,
        request.outcome_col,
        request.positive_value
    )
    
    return {
        "audit_id": audit_id,
        "status": "pending"
    }

@api_router.get("/status/{job_id}")
def get_status(job_id: str):
    doc_ref = db.collection("audits").document(job_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Audit job not found")
        
    data = doc.to_dict()
    return {
        "audit_id": job_id,
        "status": data.get("status"),
        "created_at": data.get("created_at")
    }

@api_router.get("/metrics/{audit_id}")
def get_metrics(audit_id: str):
    doc_ref = db.collection("audits").document(audit_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Audit job not found")
        
    data = doc.to_dict()
    
    if data.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Audit metrics are not completely computed yet")
        
    return data

def bucket_age_groups(group_rates_dict: dict) -> dict:
    buckets = {
        '17-24': [],
        '25-34': [],
        '35-44': [],
        '45-54': [],
        '55-64': [],
        '65+': []
    }
    for age_str, rate in group_rates_dict.items():
        try:
            age = int(float(age_str))
            if age <= 24:
                buckets['17-24'].append(rate)
            elif age <= 34:
                buckets['25-34'].append(rate)
            elif age <= 44:
                buckets['35-44'].append(rate)
            elif age <= 54:
                buckets['45-54'].append(rate)
            elif age <= 64:
                buckets['55-64'].append(rate)
            else:
                buckets['65+'].append(rate)
        except (ValueError, TypeError):
            pass

    bucketed_rates = {}
    for b_name, rates in buckets.items():
        if rates:
            bucketed_rates[b_name] = sum(rates) / len(rates)
        else:
            bucketed_rates[b_name] = 0.0
            
    return bucketed_rates


@api_router.post("/report/generate")
def generate_report(request: ReportRequest):
    doc_ref = db.collection("audits").document(request.audit_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Audit job not found")
        
    data = doc.to_dict()
    
    try:
        import copy
        report_data = copy.deepcopy(data)
        
        # Apply age bucketing dynamically
        for attr, metrics in report_data.get('metrics', {}).items():
            if attr.lower() == 'age':
                rates = metrics.get('group_rates', {})
                metrics['group_rates'] = bucket_age_groups(rates)

        # Precompute template logic
        high_severity_count = list(report_data.get("severity", {}).values()).count("High")
        
        created_timestamp = report_data.get("created_at")
        if created_timestamp and hasattr(created_timestamp, 'strftime'):
            report_data["created_at_formatted"] = created_timestamp.strftime("%d %b %Y, %H:%M UTC")
        else:
            report_data["created_at_formatted"] = str(created_timestamp)

        # Load Jinja2 template
        env = jinja2.Environment(loader=jinja2.FileSystemLoader("templates"))
        template = env.get_template("report.html")
        
        # Render HTML
        rendered_html = template.render(
            audit_id=request.audit_id, 
            audit=report_data,
            total_records=report_data.get("total_records", 0),
            high_severity_count=high_severity_count
        )
        
        # Generate PDF with WeasyPrint
        pdf_path = f"/tmp/report_{request.audit_id}.pdf"
        HTML(string=rendered_html).write_pdf(pdf_path)
        
        # Return as FileResponse
        return FileResponse(
            path=pdf_path, 
            filename=f"report_{request.audit_id}.pdf", 
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

# Include the router
app.include_router(api_router)
