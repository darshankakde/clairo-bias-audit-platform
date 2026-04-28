from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Dict, Optional, Literal, Any

# Import the Firestore client
from firebase_config import db

class AuditRecord(BaseModel):
    user_session_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dataset_name: str
    sensitive_attrs: List[str]
    outcome_col: str
    positive_value: str
    status: Literal["pending", "running", "complete", "failed"] = "pending"
    metrics: Dict[str, Any] = Field(default_factory=dict)
    severity: Dict[str, Any] = Field(default_factory=dict)
    gemini_explanation: Dict[str, Any] = Field(default_factory=dict)
    report_url: Optional[str] = None
    dataset_description: Optional[str] = None
    fairness_score: Optional[int] = None
    total_records: Optional[int] = None

def create_audit_record(record: AuditRecord) -> str:
    """
    Writes a new AuditRecord document to the 'audits' collection in Firestore
    and returns the document's auto-generated audit_id.
    """
    if db is None:
        raise Exception("Firestore client is not initialized.")
        
    collection_ref = db.collection("audits")
    
    # Extract data as a dictionary (compatible with both pydantic v1 and v2)
    data_dict = record.model_dump() if hasattr(record, "model_dump") else record.dict()
    
    # Firestore's add() auto-generates a document ID
    update_time, doc_ref = collection_ref.add(data_dict)
    
    return doc_ref.id

class AnalyzeRequest(BaseModel):
    dataset_id: str
    sensitive_attrs: List[str]
    outcome_col: str
    positive_value: str
    original_filename: str

class ReportRequest(BaseModel):
    audit_id: str
