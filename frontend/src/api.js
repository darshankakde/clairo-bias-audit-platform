import axios from 'axios';

// Create a global Axios wrapper locked to our FastAPI backend root
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Task D-1: uploadDataset
 * POST /upload/dataset
 */
export const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Explicitly override headers so FastAPI natively reads the multipart form boundary
    const response = await apiClient.post('/upload/dataset', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Task D-1: analyzeDataset 
 * POST /analyze/dataset
 */
export const analyzeDataset = async (datasetId, sensitiveAttrs, outcomeCol, positiveValue, originalFilename) => {
    const payload = {
        dataset_id: datasetId,
        sensitive_attrs: sensitiveAttrs,
        outcome_col: outcomeCol,
        positive_value: positiveValue,
        original_filename: originalFilename
    };
    
    const response = await apiClient.post('/analyze/dataset', payload);
    return response.data;
};

/**
 * Task D-1: pollStatus
 * GET /status/{jobId}
 */
export const pollStatus = async (jobId) => {
    const response = await apiClient.get(`/status/${jobId}`);
    return response.data;
};

/**
 * Task D-1: getMetrics
 * GET /metrics/{auditId}
 */
export const getMetrics = async (auditId) => {
    const response = await apiClient.get(`/metrics/${auditId}`);
    return response.data;
};

/**
 * Task D-1: generateReport
 * POST /report/generate
 */
export const generateReport = async (auditId) => {
    const payload = {
        audit_id: auditId
    };
    
    // Must declare 'blob' response type for Axios to NOT parse the incoming PDF binary as raw text.
    const response = await apiClient.post('/report/generate', payload, {
        responseType: 'blob'
    });
    return response.data; // This will fundamentally be a Blob object representing the PDF.
};
