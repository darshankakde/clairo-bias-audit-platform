import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Sparkles, BarChart3, Target, Crosshair, AlertCircle, Wrench, Lightbulb, Code, Download, Share2, CheckCircle2, FileDown, AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { pollStatus, getMetrics, generateReport } from '../api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const steps = [
    "Parsing columns...",
    "Computing fairness metrics...",
    "Generating AI explanation..."
];

const DashboardScreen = () => {
    const { auditId } = useParams();
    
    // Core App State
    const [status, setStatus] = useState('loading'); // 'loading', 'complete', 'failed'
    const [auditData, setAuditData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // UI Loading Mechanics
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('');

    // D-4 Action States
    const [reportState, setReportState] = useState('idle'); // 'idle' | 'generating' | 'ready'
    const [reportUrl, setReportUrl] = useState('#');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        let pollInterval;
        let progressInterval;
        let stepInterval;
        
        if (status === 'loading') {
            stepInterval = setInterval(() => {
                setStepIndex((prev) => (prev + 1) % steps.length);
            }, 1500);
            
            progressInterval = setInterval(() => {
                setProgress((prev) => (prev >= 90 ? 90 : prev + 1.2));
            }, 50);

            // Execute D-4 Polling Network Logic
            pollInterval = setInterval(async () => {
                try {
                    const res = await pollStatus(auditId);
                    if (res.status === 'complete') {
                        const finalData = await getMetrics(auditId);
                        setAuditData(finalData);
                        setActiveTab(finalData.sensitive_attrs[0]);
                        setStatus('complete');
                    } else if (res.status === 'failed') {
                        setErrorMsg(res.error_message || "Audit engine execution crashed natively.");
                        setStatus('failed');
                    }
                } catch (err) {
                    console.error("Polling error caught:", err);
                }
            }, 2000);
        }

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
            clearInterval(pollInterval);
        };
    }, [status, auditId]);

    const handleGenerateReport = async () => {
        setReportState('generating');
        try {
            const blob = await generateReport(auditId);
            const objectUrl = URL.createObjectURL(blob);
            setReportUrl(objectUrl);
            setReportState('ready');
        } catch (err) {
            console.error(err);
            setReportState('idle');
            alert('Failed generating report.');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const getSeverityBadge = (severity) => {
        if (severity === 'High') return 'bg-red-100 text-red-800 ring-red-600/20';
        if (severity === 'Moderate') return 'bg-amber-100 text-amber-800 ring-amber-600/20';
        return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
    };

    const getSeverityLeftBorder = (severity) => {
        if (severity === 'High') return 'border-l-red-500';
        if (severity === 'Moderate') return 'border-l-amber-500';
        return 'border-l-emerald-500';
    };

    if (status === 'failed') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-sm border border-red-100 max-w-lg w-full flex flex-col items-center text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-6">
                        <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Audit Failed</h2>
                    <p className="mt-4 text-gray-600 bg-red-50/50 p-4 rounded-xl border border-red-100 w-full text-sm font-mono break-words">
                        {errorMsg}
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'loading' || !auditData) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-100">
                        <div className="h-full bg-indigo-500 transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="relative flex items-center justify-center mb-10 mt-2">
                        <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-60 animate-pulse"></div>
                        <div className="bg-indigo-50/80 p-4 rounded-full relative ring-1 ring-indigo-100/50">
                            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                            <Sparkles className="h-5 w-5 text-amber-400 absolute top-1 right-0 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analysing your dataset...</h2>
                    <div className="mt-10 w-full px-2">
                        <div className="flex justify-between items-end text-sm font-medium mb-3">
                            <span className="text-indigo-600 animate-pulse transition-all">{steps[stepIndex]}</span>
                            <span className="text-gray-500 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-full ring-1 ring-gray-200">{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-100 ease-out relative flex items-center justify-end" style={{ width: `${Math.max(2, progress)}%` }}>
                                <div className="absolute inset-0 w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 50%, transparent)' }} />
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-gray-100 w-full">
                        <p className="text-xs text-gray-400 leading-relaxed font-medium px-4">
                            Audit ID: <span className="font-mono bg-gray-50 px-1 py-0.5 rounded text-gray-500 uppercase">{auditId}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Logic Builders 
    const currentMetricObj = auditData.metrics[activeTab] || {};
    const groupRatesMap = currentMetricObj.group_rates || {};
    const groupLabels = Object.keys(groupRatesMap);
    const groupOutcomeRates = Object.values(groupRatesMap).map(v => (v * 100).toFixed(1));

    const dpDiff = currentMetricObj.demographic_parity_difference || 0;
    const eoDiff = currentMetricObj.equalized_odds_difference || 0;
    const diRatio = currentMetricObj.disparate_impact_ratio || 0;
    const statDiff = currentMetricObj.statistical_parity_difference || 0;

    // Severity Calculation global averages
    const allSeverities = Object.values(auditData.severity || {});
    let overallSeverity = 'Low';
    if (allSeverities.includes('High')) overallSeverity = 'High';
    else if (allSeverities.includes('Moderate')) overallSeverity = 'Moderate';

    // Disparate Impact lowest value mapping as a benchmark
    const allDI = Object.values(auditData.metrics).map(m => m.disparate_impact_ratio || 1.0);
    const lowestDI = allDI.length ? Math.min(...allDI).toFixed(2) : '1.00';

    // Fairness Score Gauge State
    const score = auditData.fairness_score ?? 100;
    let scoreColorTheme = "text-emerald-500 stroke-emerald-500";
    let bannerColor = "bg-emerald-50 border-emerald-200 text-emerald-800";
    let iconColor = "text-emerald-600";
    let VerdictIcon = CheckCircle2;
    let verdictText = "This dataset meets basic fairness thresholds. Continue monitoring for bias as data evolves.";

    if (score <= 40) {
        scoreColorTheme = "text-red-500 stroke-red-500";
        bannerColor = "bg-red-50 border-red-200 text-red-800";
        iconColor = "text-red-600";
        VerdictIcon = AlertTriangle;
        verdictText = "This dataset should NOT be used for automated decisions without significant bias mitigation.";
    } else if (score <= 70) {
        scoreColorTheme = "text-amber-500 stroke-amber-500";
        bannerColor = "bg-amber-50 border-amber-200 text-amber-800";
        iconColor = "text-amber-600";
        VerdictIcon = AlertCircle;
        verdictText = "This dataset has moderate bias concerns. Review the findings below before deploying any model trained on it.";
    }

    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const activeExplanation = auditData.gemini_explanation?.[activeTab] || { summary: 'No intelligent description generated mapping this threshold logic.', impact: '', root_cause: '', severity: 'Unknown' };
    const activeSeverity = auditData.severity?.[activeTab] || 'Unknown';

    // Compile dynamic Radar Data
    const mappedRadarData = {
        labels: auditData.sensitive_attrs,
        datasets: [{
            label: 'Bias Error Distance (Proxy Index)',
            data: auditData.sensitive_attrs.map(attr => parseFloat(auditData.metrics[attr]?.demographic_parity_difference || 0)),
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
        }]
    };

    return (
        <div className="max-w-7xl mx-auto mt-6 pb-14 animate-in fade-in zoom-in duration-500">
            {/* Dashboard Header Master Overlay */}
            <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in zoom-in-95 duration-500 delay-150 fill-mode-both">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Audit Results</h1>
                        <div className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="uppercase tracking-wider font-bold text-[10px] text-emerald-700">Complete</span>
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Review detailed fairness constraints and AI diagnostics mapping.</p>
                </div>
                
                {/* Compact Fairness Score & Verdict */}
                <div className={`flex flex-col sm:flex-row sm:items-center gap-4 py-3 px-5 rounded-xl border ${bannerColor} xl:max-w-lg shadow-sm`}>
                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle 
                                cx="28" cy="28" r={radius}
                                className="stroke-gray-100" 
                                strokeWidth="5" fill="none"
                            />
                            {/* Progress Circle */}
                            <circle 
                                cx="28" cy="28" r={radius}
                                className={`transition-all duration-1000 ease-out ${scoreColorTheme.split(' ')[1]}`}
                                strokeWidth="5" fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className={`text-[15px] font-extrabold tracking-tight ${scoreColorTheme.split(' ')[0]}`}>{score}</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <VerdictIcon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${iconColor}`}>Fairness Verdict</span>
                        </div>
                        <p className={`text-[13px] font-semibold leading-tight mt-0.5 ${iconColor} opacity-90`}>
                            {verdictText}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dataset Description Box */}
            {(auditData.dataset_description) && (
                <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200 flex items-start gap-3">
                    <Info className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase mb-1">About this dataset</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {auditData.dataset_description}
                        </p>
                    </div>
                </div>
            )}

            {/* Metric Summary Cards Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Overall Severity</p>
                    <div className="mt-1 flex items-center">
                        <span className={`inline-flex items-center rounded-lg px-4 py-2 text-xl font-bold ring-1 ring-inset ${getSeverityBadge(overallSeverity)}`}>
                            {overallSeverity}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Lowest Disparate Impact</p>
                    <p className="mt-1 text-4xl font-black text-gray-900 tracking-tight">
                        {lowestDI}
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Groups Affected</p>
                    <p className="mt-1 text-4xl font-black text-gray-900 tracking-tight">
                        {auditData.sensitive_attrs?.length || 0}
                    </p>
                </div>
            </div>

            {/* Main Tabs Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="border-b border-gray-200 bg-gray-50/50">
                    <nav className="-mb-px flex space-x-8 px-8 overflow-x-auto" aria-label="Tabs">
                        {auditData.sensitive_attrs.map((attr) => (
                            <button
                                key={attr}
                                onClick={() => setActiveTab(attr)}
                                className={`whitespace-nowrap border-b-2 py-5 px-2 text-sm font-bold transition-colors ${activeTab === attr ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'}`}
                            >
                                {attr}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-8">
                    {/* Clairo Insight AI Card */}
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 border-l-[3px] border-l-[#6d5efc] bg-[#fbfaff] shadow-sm mb-10 p-6 sm:p-7">
                        <div className="text-[11px] font-bold text-[#6d5efc] tracking-widest uppercase mb-4">Clairo Insight</div>
                        
                        <div className="text-[14.5px] leading-relaxed text-gray-800 mb-6 pb-6 border-b border-gray-100">
                            {typeof activeExplanation !== 'string' && activeExplanation.insight_sentence ? (
                                <span dangerouslySetInnerHTML={{ __html: activeExplanation.insight_sentence }} />
                            ) : (
                                <span>{typeof activeExplanation === 'string' ? activeExplanation : activeExplanation.summary}</span>
                            )}
                        </div>

                        {typeof activeExplanation !== 'string' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-[13.5px]">
                                <div>
                                    <div className="font-bold text-gray-900 uppercase tracking-widest text-[10px] mb-1.5 text-[#6d5efc]/70">Summary</div>
                                    <div className="text-gray-700 leading-snug font-medium">{activeExplanation.summary}</div>
                                </div>
                                {activeExplanation.impact && (
                                <div>
                                    <div className="font-bold text-gray-900 uppercase tracking-widest text-[10px] mb-1.5 text-[#6d5efc]/70">Impact</div>
                                    <div className="text-gray-700 leading-snug font-medium">{activeExplanation.impact}</div>
                                </div>
                                )}
                                {activeExplanation.root_cause && (
                                <div>
                                    <div className="font-bold text-gray-900 uppercase tracking-widest text-[10px] mb-1.5 text-[#6d5efc]/70">Root Cause</div>
                                    <div className="text-gray-700 leading-snug font-medium">{activeExplanation.root_cause}</div>
                                </div>
                                )}
                                {activeExplanation.severity && activeExplanation.severity !== 'Unknown' && (
                                <div>
                                    <div className="font-bold text-gray-900 uppercase tracking-widest text-[10px] mb-1.5 text-[#6d5efc]/70">Severity</div>
                                    <div className={`font-bold ${activeExplanation.severity === 'High' ? 'text-red-600' : activeExplanation.severity === 'Moderate' ? 'text-amber-600' : 'text-[#0bb39a]'}`}>
                                        {activeExplanation.severity}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* 4 Chart Matrix Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Chart 1: Outcome rate by group */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col relative group">
                            <div className="mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-indigo-400" />
                                <h3 className="text-sm font-bold text-gray-800 tracking-wide">Positive Outcome Rate</h3>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                <Bar 
                                    data={{
                                        labels: groupLabels,
                                        datasets: [{
                                            label: 'Outcome Rate (%)',
                                            data: groupOutcomeRates,
                                            backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(56, 189, 248, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(248, 113, 113, 0.8)', 'rgba(167, 139, 250, 0.8)'],
                                            borderRadius: 6
                                        }]
                                    }} 
                                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }}
                                />
                            </div>
                        </div>

                        {/* Chart 2: Fairness metrics vs threshold (Rebuilt as Custom HTML Component) */}
                        <div className="bg-slate-50 p-6 rounded-[14px] border border-slate-100 flex flex-col pt-7 pb-8 px-7 shadow-sm">
                            <h3 className="text-[17px] font-bold text-slate-900 tracking-wide mb-8">Fairness Metrics</h3>
                            <div className="flex-1 flex flex-col gap-6">
                                {/* Demographic Parity */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[15px] text-slate-800">Demographic Parity</span>
                                            {dpDiff <= 0.20 ? <TrendingUp className="w-4 h-4 text-[#10b981]" strokeWidth={2.5} /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={2.5} />}
                                        </div>
                                        <span className={`font-bold text-[15.5px] tracking-wide ${dpDiff <= 0.20 ? 'text-[#10b981]' : 'text-[#c62828]'}`}>
                                            {dpDiff.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] text-slate-500 mb-3 -mt-2.5">Difference in positive outcome rates</div>
                                    <div className="h-[7px] w-full bg-slate-200/80 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${dpDiff <= 0.20 ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`} style={{ width: `${Math.min((dpDiff / 0.5) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                
                                {/* Disparate Impact */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[15px] text-slate-800">Disparate Impact</span>
                                            {diRatio >= 0.80 ? <TrendingUp className="w-4 h-4 text-[#10b981]" strokeWidth={2.5} /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={2.5} />}
                                        </div>
                                        <span className={`font-bold text-[15.5px] tracking-wide ${diRatio >= 0.80 ? 'text-[#10b981]' : 'text-[#c62828]'}`}>
                                            {diRatio.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] text-slate-500 mb-3 -mt-2.5">Ratio of outcome rates (80% rule)</div>
                                    <div className="h-[7px] w-full bg-slate-200/80 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${diRatio >= 0.80 ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`} style={{ width: `${Math.min((diRatio / 1.5) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                {/* Equalized Odds */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[15px] text-slate-800">Equalized Odds</span>
                                            {eoDiff <= 0.20 ? <TrendingUp className="w-4 h-4 text-[#10b981]" strokeWidth={2.5} /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={2.5} />}
                                        </div>
                                        <span className={`font-bold text-[15.5px] tracking-wide ${eoDiff <= 0.20 ? 'text-[#10b981]' : 'text-[#c62828]'}`}>
                                            {eoDiff.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] text-slate-500 mb-3 -mt-2.5">TPR & FPR difference</div>
                                    <div className="h-[7px] w-full bg-slate-200/80 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${eoDiff <= 0.20 ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`} style={{ width: `${Math.min((eoDiff / 0.5) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                {/* Statistical Parity */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[15px] text-slate-800">Statistical Parity</span>
                                            {statDiff <= 0.20 ? <TrendingUp className="w-4 h-4 text-[#10b981]" strokeWidth={2.5} /> : <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={2.5} />}
                                        </div>
                                        <span className={`font-bold text-[15.5px] tracking-wide ${statDiff <= 0.20 ? 'text-[#10b981]' : 'text-[#c62828]'}`}>
                                            {statDiff.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] text-slate-500 mb-3 -mt-2.5">Overall statistical gap</div>
                                    <div className="h-[7px] w-full bg-slate-200/80 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${statDiff <= 0.20 ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`} style={{ width: `${Math.min((statDiff / 0.5) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart 3: Bias severity radar (Overall context) */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col">
                            <div className="mb-4 flex items-center gap-2">
                                <Crosshair className="h-5 w-5 text-amber-500" />
                                <h3 className="text-sm font-bold text-gray-800 tracking-wide">Global DP Difference Map</h3>
                            </div>
                            <div className="flex-1 min-h-[300px] flex items-center justify-center pt-2">
                                <Radar 
                                    data={mappedRadarData}
                                    options={{ responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0 } } }}
                                />
                            </div>
                        </div>

                        {/* Chart 4: System Volume Distribution by Group (Replaced FP/FN since uncalculated natively) */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col">
                            <div className="mb-4 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-indigo-400" />
                                <h3 className="text-sm font-bold text-gray-800 tracking-wide">Target Outcome Deviation Map</h3>
                            </div>
                            <div className="flex-1 min-h-[300px]">
                                <Bar 
                                    data={{
                                        labels: groupLabels,
                                        datasets: [
                                            {
                                                label: 'Group Deviation Index',
                                                data: groupLabels.map((g, i) => Math.abs(parseFloat(groupOutcomeRates[0]) - parseFloat(groupOutcomeRates[i]))),
                                                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                                                borderRadius: 4
                                            }
                                        ]
                                    }} 
                                    options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Fix Suggestions Panel */}
            <div className="mt-4 mb-4">
                <div className="mb-6 flex flex-col md:flex-row md:items-center gap-2">
                    <Wrench className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recommended Technical Fixes</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        {
                            title: "Rebalance dataset",
                            when: "When Demographic Parity > 0.1",
                            code: "from imblearn.over_sampling import SMOTE; df_resampled = SMOTE().fit_resample(X, y)",
                            severity: "High"
                        },
                        {
                            title: "Remove proxy variables",
                            when: "When Disparate Impact < 0.8",
                            code: "df.drop(columns=['correlated_col'], inplace=True)",
                            severity: "Moderate"
                        },
                        {
                            title: "Reweight samples",
                            when: "When Equalized Odds difference is high",
                            code: "model.fit(X, y, sample_weight=compute_sample_weight('balanced', y))",
                            severity: "High"
                        },
                        {
                            title: "Adjust decision threshold",
                            when: "When Group Outcome Rates diverge significantly",
                            code: "from fairlearn.postprocessing import ThresholdOptimizer",
                            severity: "Moderate"
                        }
                    ].map((fix, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{fix.title}</h3>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                    fix.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    Addresses: {fix.severity} Severity
                                </span>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    <span>When to apply:</span>
                                </div>
                                <p className="text-gray-800 text-sm ml-6">{fix.when}</p>
                            </div>
                            
                            <div className="bg-gray-900 rounded-xl p-4 flex items-start gap-3">
                                <Code className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                                <code className="text-sm font-mono text-indigo-300 break-all">{fix.code}</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions Panel */}
            <div className="mt-10 mb-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    <p>Audit generated accurately reflecting configuration parameters.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative isolate">
                        <button 
                            onClick={handleShare}
                            className="p-3 text-gray-600 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none"
                            title="Share Report"
                        >
                            {isCopied ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5" />}
                        </button>
                        
                        {/* Tooltip */}
                        {isCopied && (
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold py-1.5 px-3 rounded-lg animate-in fade-in slide-in-from-bottom-1 whitespace-nowrap">
                                Copied!
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                    </div>
                    
                    {reportState === 'idle' && (
                        <button 
                            onClick={handleGenerateReport}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-all active:scale-95 cursor-pointer"
                        >
                            <Download className="h-5 w-5" />
                            Download Report
                        </button>
                    )}
                    
                    {reportState === 'generating' && (
                        <button 
                            disabled
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-400 px-6 py-3 text-sm font-bold text-white shadow-md cursor-not-allowed transition-all"
                        >
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating report...
                        </button>
                    )}
                    
                    {reportState === 'ready' && (
                        <a 
                            href={reportUrl}
                            download={`Clairo_Audit_Report_${auditId}.pdf`}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-all active:scale-95 animate-in zoom-in duration-300"
                        >
                            <FileDown className="h-5 w-5" />
                            Report ready — Download PDF
                        </a>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardScreen;
