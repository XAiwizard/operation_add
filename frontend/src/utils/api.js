import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Data APIs ───
export async function uploadFile(file, projectId = 'default') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);
  const res = await api.post('/api/data/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getData(projectId = 'default') {
  const res = await api.get(`/api/data/${projectId}`);
  return res.data;
}

export async function saveToDb(projectId = 'default') {
  const formData = new FormData();
  formData.append('project_id', projectId);
  const res = await api.post('/api/data/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ─── Preprocessing API ───
export async function preprocess(action, columns, params = {}, projectId = 'default') {
  const res = await api.post('/api/preprocess', {
    project_id: projectId,
    action,
    columns,
    params,
  });
  return res.data;
}

// ─── Model Training API ───
export async function trainModel(modelType, features, target, params = {}, projectId = 'default') {
  const res = await api.post('/api/model/train', {
    project_id: projectId,
    model_type: modelType,
    features,
    target,
    params,
  });
  return res.data;
}

// ─── Feature Store API ───
export async function getFeatureStore() {
  const res = await api.get('/api/feature-store');
  return res.data;
}

export default api;
