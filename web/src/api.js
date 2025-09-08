import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Upload a GeoTIFF file
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Create a processing job
export const createJob = async (imageAId, imageBId, aoi) => {
  const response = await api.post('/api/jobs', {
    imageAId,
    imageBId,
    aoi,
  });
  
  return response.data;
};

// Get job status
export const getJobStatus = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
};

// Get processed image URL
export const getImageUrl = (imagePath) => {
  return `${API_BASE_URL}${imagePath}`;
};
