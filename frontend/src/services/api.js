import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/pdt';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const sendVoiceCommand = async (voice_query, session_id = 'default_session') => {
  const response = await api.post('/voice/command', { voice_query, session_id });
  return response.data;
};

export const getConversationHistory = async (session_id = 'default_session') => {
  const response = await api.get(`/conversation/history?session_id=${session_id}`);
  return response.data;
};

export const clearConversationHistory = async (session_id = 'default_session') => {
  const response = await api.post(`/conversation/clear?session_id=${session_id}`);
  return response.data;
};


export const getReminders = async () => {
  const response = await api.get('/reminders');
  return response.data;
};

export const deleteReminder = async (reminderId) => {
  const response = await api.delete(`/reminders/${reminderId}`);
  return response.data;
};


export const getTwinState = async () => {
  const response = await api.get('/state');
  return response.data;
};

export const updateTwinState = async (stateData) => {
  const response = await api.put('/state', stateData);
  return response.data;
};

export const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const getPredictions = async () => {
  const response = await api.get('/predict');
  return response.data;
};

export const generateCandidatePlans = async (goalRequest) => {
  const response = await api.post('/planner/generate', goalRequest);
  return response.data;
};

export const getPolicyAuditLogs = async () => {
  const response = await api.get('/policy/audit');
  return response.data;
};

export const submitActionDecision = async (auditId, decision) => {
  const response = await api.post('/policy/decision', { audit_id: auditId, decision });
  return response.data;
};

export const getMemories = async () => {
  const response = await api.get('/memory');
  return response.data;
};

export const addMemory = async (memoryData) => {
  const response = await api.post('/memory', memoryData);
  return response.data;
};

export const deleteMemory = async (memoryId) => {
  const response = await api.delete(`/memory/${memoryId}`);
  return response.data;
};

export const getAblationScenarios = async () => {
  const response = await api.get('/ablation/scenarios');
  return response.data;
};

export const runAblationBenchmark = async (scenarioId = 'ALL') => {
  const response = await api.post(`/ablation/run?scenario_id=${scenarioId}`);
  return response.data;
};

export default api;
