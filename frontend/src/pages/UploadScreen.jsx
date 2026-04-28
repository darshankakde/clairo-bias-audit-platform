import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, FileText, Loader2, X, FileSpreadsheet } from 'lucide-react';
import { uploadDataset } from '../api';

const UploadScreen = () => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const validateFile = (selectedFile) => {
        setError(null);
        if (!selectedFile) return false;
        
        // Check extensions
        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
            setError('Only CSV and XLSX files are supported.');
            return false;
        }

        // Check size (50MB)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be under 50 MB.');
            return false;
        }

        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleContinue = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);
        
        try {
            const data = await uploadDataset(file);
            navigate(`/confirm/${data.dataset_id}`, { state: { data } });
        } catch (err) {
            setError('Upload failed — please check the file format and try again');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDemoDataset = async () => {
        setIsUploading(true);
        setError(null);
        
        try {
            // Fetching a public variant of the Adult Income Dataset that includes explicit column headers
            const response = await fetch('https://raw.githubusercontent.com/sdsu-ml-ai/dataset/main/adult.csv');
            if (!response.ok) throw new Error("Failed to fetch mock dataset from URL endpoint.");
            
            const blob = await response.blob();
            // Transform the fetched blob byte-stream directly onto an emulated browser File object matching standard input behaviors
            const mockDemoFile = new File([blob], 'adult_income_demo.csv', { type: 'text/csv' });
            
            const data = await uploadDataset(mockDemoFile);
            navigate(`/confirm/${data.dataset_id}`, { state: { data } });
        } catch (err) {
            setError('Demo initialization failed. Please run manually or check your internet connection.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-6 sm:mt-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Upload Dataset</h1>
                <p className="mt-4 text-lg text-gray-500">Upload your CSV or XLSX file to begin the fairness audit.</p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
                
                {/* File Upload Zone */}
                {!file ? (
                    <div 
                        className={`mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-20 transition-all ${
                            isDragging 
                            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
                            : 'border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/30'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="text-center cursor-pointer">
                            <CloudUpload className={`mx-auto h-14 w-14 transition-colors ${isDragging ? 'text-indigo-500' : 'text-indigo-400'}`} />
                            <div className="mt-5 flex text-base leading-6 text-gray-600 justify-center">
                                <span className="relative cursor-pointer rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2">
                                    <span>Click to browse</span>
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        className="sr-only" 
                                        accept=".csv, .xlsx"
                                        onChange={handleFileSelect}
                                    />
                                </span>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-sm leading-5 text-gray-500 mt-2 font-medium">CSV or XLSX up to 50MB</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                        {/* Selected File Card */}
                        <div className="flex items-center space-x-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100 w-full mb-6">
                            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
                                {file.name.endsWith('.csv') ? (
                                    <FileText className="h-7 w-7 text-indigo-600" />
                                ) : (
                                    <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-gray-900 truncate">{file.name}</h4>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                                onClick={handleRemoveFile}
                                disabled={isUploading}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                title="Remove file"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {/* Continue Button */}
                        <button
                            onClick={handleContinue}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 transition-all active:scale-[0.98]"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Uploading and parsing dataset...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </div>
                )}
                
                {/* Error Banner */}
                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm text-red-600 text-center font-semibold">{error}</p>
                    </div>
                )}

                {/* Divider */}
                <div className="mt-10 flex items-center justify-center">
                    <div className="border-t border-gray-200 flex-grow"></div>
                    <span className="px-5 text-sm text-gray-400 bg-white font-medium uppercase tracking-wider">OR</span>
                    <div className="border-t border-gray-200 flex-grow"></div>
                </div>

                {/* Demo Button */}
                <div className="mt-8 text-center bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <button
                        type="button"
                        onClick={handleDemoDataset}
                        disabled={isUploading}
                        className="text-base font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center mx-auto gap-2"
                    >
                        Try demo dataset <span aria-hidden="true" className="text-lg">→</span>
                    </button>
                    <p className="mt-2 text-sm text-gray-500">Loads the standard Adult Income Dataset instantly.</p>
                </div>
                
            </div>
        </div>
    );
};

export default UploadScreen;
