import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Table, ShieldAlert, Target, Info, X, Play, ChevronDown, AlertTriangle } from 'lucide-react';
import { analyzeDataset } from '../api';

const ConfirmScreen = () => {
    const { datasetId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Data mapped from Upload routing transition
    const uploadData = location.state?.data || {};
    const columns = uploadData.columns || [];
    const previewData = uploadData.preview || [];
    const detectedSensitive = uploadData.detected_sensitive_attrs || [];
    const originalFilename = uploadData.original_filename || datasetId;
    const suggestedOutcome = uploadData.suggested_outcome_col || '';
    const uniqueValuesMapping = uploadData.unique_values || {};

    // Configuration State - initialized securely with backend detected attributes
    const [sensitiveCols, setSensitiveCols] = useState(detectedSensitive);
    const [outcomeCol, setOutcomeCol] = useState(detectedSensitive.includes(suggestedOutcome) ? '' : suggestedOutcome);
    const [positiveValue, setPositiveValue] = useState('');
    const [exclusionWarning, setExclusionWarning] = useState('');
    
    // UI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const removeSensitiveCol = (col) => {
        setSensitiveCols(sensitiveCols.filter(c => c !== col));
    };

    const addSensitiveCol = (e) => {
        const value = e.target.value;
        if (value && !sensitiveCols.includes(value)) {
            setSensitiveCols([...sensitiveCols, value]);
            if (value === outcomeCol) {
                setOutcomeCol('');
                setExclusionWarning('This column was removed from the outcome selector since it is now a sensitive attribute.');
                setTimeout(() => setExclusionWarning(''), 6000);
            }
        }
        e.target.value = ''; // Reset dropdown logic directly on DOM element ref natively
    };

    const handleOutcomeSelect = (e) => {
        const value = e.target.value;
        setOutcomeCol(value);
        if (sensitiveCols.includes(value)) {
            setSensitiveCols(sensitiveCols.filter(c => c !== value));
            setExclusionWarning('');
        }
    };

    const handleRunAnalysis = async () => {
        // Explicit soft validation hooks mandated in Task D-3
        if (sensitiveCols.length === 0) return setError("At least one sensitive attribute must be selected.");
        if (!outcomeCol) return setError("An outcome column must be mapped.");
        if (!positiveValue) return setError("A positive outcome condition must be securely defined.");

        setIsAnalyzing(true);
        setError('');

        try {
            const data = await analyzeDataset(datasetId, sensitiveCols, outcomeCol, positiveValue, originalFilename);
            navigate(`/results/${data.audit_id}`);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to initiate AI analysis engine. Ensure backend server is online.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 mt-4 pb-12 animate-in fade-in zoom-in duration-300">
            
            {/* Header Identity Block */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configure Audit</h1>
                <p className="mt-2 text-gray-600">Review your dataset parameters and define variables targeted for the fairness analysis loop.</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-100 w-fit px-3 py-1.5 rounded-full border border-gray-200">
                    <Info className="h-4 w-4" />
                    <span>Dataset ID: <span className="font-mono text-gray-700 font-semibold">{datasetId}</span></span>
                </div>
            </div>

            {/* Scrollable Preview Table Panel */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Table className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Dataset Preview</h2>
                    <span className="ml-2 text-xs font-semibold bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md uppercase tracking-wide">First 5 rows</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-50/50 border-b border-gray-200 font-semibold tracking-wider">
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} className="px-5 py-4 min-w-[140px] truncate">{col}</th>
                                ))}
                                {columns.length === 0 && <th className="px-5 py-4 min-w-[140px] italic text-gray-400">No columns detected</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {previewData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50/80 transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-5 py-3.5 text-gray-700 truncate max-w-[220px]">
                                            {row[col] !== undefined && row[col] !== null ? String(row[col]) : <span className="text-gray-400 italic">null</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {previewData.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length || 1} className="px-5 py-4 text-center text-gray-500 italic">No dataset preview rendered.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Definition Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Sensitive Attribute Control block */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Sensitive Columns</h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                            These variables specify protected classes. They will be rigidly evaluated to uncover statistical offsets natively linked to your specified outcomes.
                        </p>
                        
                        {/* Selected Chips */}
                        <div className="flex flex-wrap gap-2.5 mb-8">
                            {sensitiveCols.map(col => (
                                <div key={col} className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 text-sm font-semibold shadow-sm transition-transform hover:scale-105">
                                    {col}
                                    <button 
                                        onClick={() => removeSensitiveCol(col)}
                                        className="p-0.5 hover:bg-amber-200 hover:text-amber-950 rounded-md transition-colors isolate ml-1 cursor-pointer focus:outline-none"
                                        title="Remove attribute"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {sensitiveCols.length === 0 && (
                                <span className="text-sm text-gray-400 italic py-1.5">No sensitive columns selected.</span>
                            )}
                        </div>

                        {/* Add Attribute Drop */}
                        <div className="mt-auto">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Manually Add Attribute</label>
                            <div className="relative">
                                <select 
                                    className="appearance-none outline-none block w-full rounded-xl border-0 py-3.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm shadow-sm bg-white cursor-pointer hover:ring-gray-400 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    defaultValue=""
                                    onChange={addSensitiveCol}
                                    disabled={columns.length === 0}
                                >
                                    <option value="" disabled>-- Select available columns --</option>
                                    {columns.filter(c => !sensitiveCols.includes(c)).map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Target Mapping Control Block */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Outcome Definition</h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col space-y-7">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Select the final target column optimized by this dataset, and clarify what specific label translates into the "positive" variant to audit upon.
                        </p>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target Column</label>
                            <div className="relative">
                                <select 
                                    className="appearance-none outline-none block w-full rounded-xl border-0 py-3.5 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm shadow-sm bg-white cursor-pointer hover:ring-gray-400 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    value={outcomeCol}
                                    onChange={handleOutcomeSelect}
                                    disabled={columns.length === 0}
                                >
                                    <option value="" disabled>-- Select outcome mapping --</option>
                                    {columns.map((col, index) => (
                                        <option key={index} value={col}>{col}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                            {exclusionWarning && (
                                <div className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 shadow-sm">
                                    {exclusionWarning}
                                </div>
                            )}
                        </div>

                        {outcomeCol && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Define Favorable Value
                                </label>
                                {uniqueValuesMapping[outcomeCol] && uniqueValuesMapping[outcomeCol].length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {uniqueValuesMapping[outcomeCol].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setPositiveValue(val)}
                                                className={`px-5 py-2.5 outline-none rounded-xl text-[14.5px] tracking-wide font-semibold transition-all ${positiveValue === val ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-300 shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="e.g. <=50K, Approved, Granted, 1"
                                        value={positiveValue}
                                        onChange={(e) => setPositiveValue(e.target.value)}
                                        className="block w-full rounded-xl outline-none border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm shadow-sm hover:ring-gray-400 transition-shadow"
                                    />
                                )}
                                <div className="mt-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-2">
                                    <Info className="h-4 w-4 text-emerald-600 mt-0.5" shrink-0="true"/>
                                    <p className="text-xs text-emerald-700 leading-snug font-medium">Matches exactly computing bias mappings. Select the value representing a positive outcome.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Error Output Catch Block */}
            {error && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
            )}

            {/* Commit Footer Action */}
            <div className="mt-6 pt-4 flex justify-end">
                <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing || !outcomeCol || !positiveValue || sensitiveCols.length === 0}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:shadow-none transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin drop-shadow-md" />
                    ) : (
                        <Play className="h-5 w-5 fill-white drop-shadow-md" />
                    )}
                    {isAnalyzing ? 'Initializing Core Engine...' : 'Run Analysis Execution'}
                </button>
            </div>
        </div>
    );
};

export default ConfirmScreen;
