import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TwinStateView from './components/TwinStateView';
import ScheduleView from './components/ScheduleView';
import AgenticPlannerView from './components/AgenticPlannerView';
import PolicyAuditView from './components/PolicyAuditView';
import MemoryInspectorView from './components/MemoryInspectorView';
import AblationLabView from './components/AblationLabView';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import UserProfileModal from './components/UserProfileModal';

import {
  getTwinState,
  updateTwinState,
  getTasks,
  createTask,
  deleteTask,
  getPredictions,
  generateCandidatePlans,
  getPolicyAuditLogs,
  submitActionDecision,
  getMemories,
  addMemory,
  deleteMemory,
  getAblationScenarios,
  runAblationBenchmark,
  getReminders,
  deleteReminder
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('twin');
  const [twinState, setTwinState] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [candidatePlans, setCandidatePlans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [memories, setMemories] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [ablationData, setAblationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals & User state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState({ full_name: 'Santhosh Kumar', email: 'santhoshkumarm102@gmail.com' });
  const [theme, setTheme] = useState('dark');

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      const [stateRes, tasksRes, remRes, predRes, logsRes, memRes, scenRes, abRes] = await Promise.all([
        getTwinState(),
        getTasks(),
        getReminders(),
        getPredictions(),
        getPolicyAuditLogs(),
        getMemories(),
        getAblationScenarios(),
        runAblationBenchmark('ALL')
      ]);
      setTwinState(stateRes);
      setTasks(tasksRes);
      setReminders(remRes);
      setPredictions(predRes);
      setAuditLogs(logsRes);
      setMemories(memRes);
      setScenarios(scenRes);
      setAblationData(abRes);
    } catch (err) {
      console.error('Failed to connect to backend server:', err);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateTwinState = async (newState) => {
    try {
      const updated = await updateTwinState(newState);
      setTwinState(updated);
      showNotification('Twin state updated & synchronized successfully!', 'success');
      const predRes = await getPredictions();
      setPredictions(predRes);
    } catch (err) {
      showNotification('Failed to update twin state.', 'error');
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await createTask(taskData);
      showNotification('Task added to schedule!', 'success');
      loadData();
    } catch (err) {
      showNotification('Failed to create task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      showNotification('Task removed.', 'info');
      loadData();
    } catch (err) {
      showNotification('Failed to delete task.', 'error');
    }
  };

  const handleGeneratePlans = async (goalReq) => {
    setIsLoading(true);
    try {
      const plans = await generateCandidatePlans(goalReq);
      setCandidatePlans(plans);
      showNotification('Candidate plans generated with utility scoring!', 'success');
    } catch (err) {
      showNotification('Failed to generate plans.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPlan = async (plan) => {
    showNotification(`Applied ${plan.plan_name}! Twin schedule updated.`, 'success');
    loadData();
  };

  const handleActionDecision = async (auditId, decision) => {
    try {
      await submitActionDecision(auditId, decision);
      showNotification(`Action ${decision}d successfully!`, decision === 'approve' ? 'success' : 'info');
      loadData();
    } catch (err) {
      showNotification('Failed to process consent decision.', 'error');
    }
  };

  const handleAddMemory = async (memData) => {
    try {
      await addMemory(memData);
      showNotification('Preference rule added to agent memory!', 'success');
      loadData();
    } catch (err) {
      showNotification('Failed to add memory.', 'error');
    }
  };

  const handleDeleteMemory = async (memId) => {
    try {
      await deleteMemory(memId);
      showNotification('Memory item removed.', 'info');
      loadData();
    } catch (err) {
      showNotification('Failed to delete memory.', 'error');
    }
  };

  const handleRunBenchmark = async (scenarioId) => {
    setIsLoading(true);
    try {
      const res = await runAblationBenchmark(scenarioId);
      setAblationData(res);
      showNotification('Benchmark scenario suite completed!', 'success');
    } catch (err) {
      showNotification('Failed to run benchmark suite.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteReminder(reminderId);
      showNotification('Reminder removed.', 'info');
      loadData();
    } catch (err) {
      showNotification('Failed to delete reminder.', 'error');
    }
  };

  const pendingPolicyCount = auditLogs.filter(l => l.status === 'pending_user_consent').length;

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${
      theme === 'midnight' ? 'bg-[#0b0816]' : 'bg-[#080c14]'
    }`}>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center space-x-2 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' 
            : notification.type === 'error'
            ? 'bg-rose-950 text-rose-300 border-rose-500/50'
            : 'bg-slate-900 text-cyan-300 border-cyan-500/50'
        }`}>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        twinState={twinState}
        conflictsCount={predictions.length}
        pendingPolicyCount={pendingPolicyCount}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'midnight' : 'dark')}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'twin' && (
          <TwinStateView
            twinState={twinState}
            onUpdateState={handleUpdateTwinState}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            tasks={tasks}
            reminders={reminders}
            predictions={predictions}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onDeleteReminder={handleDeleteReminder}
          />
        )}


        {activeTab === 'planner' && (
          <AgenticPlannerView
            onGeneratePlans={handleGeneratePlans}
            candidatePlans={candidatePlans}
            isLoading={isLoading}
            onApplyPlan={handleApplyPlan}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyAuditView
            auditLogs={auditLogs}
            onActionDecision={handleActionDecision}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryInspectorView
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        )}

        {activeTab === 'ablation' && (
          <AblationLabView
            scenarios={scenarios}
            ablationData={ablationData}
            onRunBenchmark={handleRunBenchmark}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Modals */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onScheduleChange={loadData}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        setUser={setUser}
        theme={theme}
        setTheme={setTheme}
        onNotification={showNotification}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 mt-8 bg-[#060910]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center">PDT</span>
            <span>Agentic AI-Based Personal Digital Twin for Predictive Daily Resource Optimization (PDT-PRO)</span>
          </div>
          <div className="text-center font-mono text-[10px] text-slate-600">
            Authors: Palanisamy K, Santhoshkumar M, Saran R, Selvakumar D (Karpagam Academy of Higher Education)
          </div>
          <div className="font-mono text-[10px] text-slate-600">
            © 2026 PDT-PRO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
