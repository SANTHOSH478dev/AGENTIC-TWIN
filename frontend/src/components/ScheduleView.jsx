import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Brain, 
  Zap, 
  DollarSign, 
  Trash2, 
  Lock, 
  Unlock,
  Bell,
  RotateCcw
} from 'lucide-react';

const ScheduleView = ({ tasks = [], reminders = [], predictions = [], onAddTask, onDeleteTask, onDeleteReminder }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Work',
    start_time: '14:00',
    end_time: '15:00',
    duration_mins: 60,
    is_fixed: false,
    cognitive_load: 5.0,
    energy_cost: 4.0,
    monetary_cost: 0.0,
    mobility_req: false,
    location: 'Office',
    priority: 3
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    onAddTask(newTask);
    setShowAddModal(false);
    setNewTask({
      title: '',
      category: 'Work',
      start_time: '14:00',
      end_time: '15:00',
      duration_mins: 60,
      is_fixed: false,
      cognitive_load: 5.0,
      energy_cost: 4.0,
      monetary_cost: 0.0,
      mobility_req: false,
      location: 'Office',
      priority: 3
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="saas-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Dynamic Daily Resource Schedule & Active Automations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-resource timeline featuring scheduled tasks, active AI reminders, and predictive conflict detection.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Forecasted Conflict Alerts Banner */}
      {predictions && predictions.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Predicted Resource Conflicts ({predictions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictions.map((pred, idx) => (
              <div key={idx} className="saas-card p-4 border-rose-500/40 pulse-alert-border bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    {pred.conflict_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono">Confidence: {Math.round(pred.confidence_score * 100)}%</span>
                </div>
                <p className="text-xs font-medium text-slate-200">{pred.description}</p>
                {pred.suggested_resolution && (
                  <div className="pt-2 border-t border-rose-900/40 text-[11px] text-slate-400">
                    💡 Resolution: <span className="text-cyan-300 font-medium">{pred.suggested_resolution}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active AI Reminders Section */}
      {reminders && reminders.length > 0 && (
        <div className="saas-card p-4 space-y-2.5 border-cyan-500/30 bg-cyan-950/10">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Active AI Reminders & Scheduled Automations ({reminders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {reminders.map((rem) => (
              <div key={rem.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{rem.task_name}</h4>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                      <span>⏰ {rem.scheduled_time}</span>
                      {rem.is_recurring && (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <RotateCcw className="w-2.5 h-2.5" /> Recurring
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {onDeleteReminder && (
                  <button
                    onClick={() => onDeleteReminder(rem.id)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs"
                    title="Cancel Reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="saas-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Scheduled Commitments & Tasks ({tasks.length})
        </h3>

        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isHighCognitive = task.cognitive_load >= 7.0;
            return (
              <div 
                key={task.id} 
                className={`p-3.5 rounded-xl border transition-all duration-150 ${
                  isHighCognitive 
                    ? 'bg-slate-900/90 border-indigo-500/30 hover:border-indigo-500/60' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-cyan-400 text-xs font-bold min-w-[80px]">
                      <span>{task.start_time}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{task.end_time}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-100">{task.title}</h4>
                        {task.is_fixed ? (
                          <span className="flex items-center gap-1 text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            <Lock className="w-2.5 h-2.5" /> Fixed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            <Unlock className="w-2.5 h-2.5" /> Flexible
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono">
                          {task.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {task.duration_mins}m
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" /> {task.location}
                        </span>
                        {task.monetary_cost > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 font-medium">
                            <DollarSign className="w-3 h-3" /> ${task.monetary_cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end space-y-1 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isHighCognitive 
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        <Brain className="w-3 h-3" /> Cog: {task.cognitive_load}/10
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Energy: {task.energy_cost}/10
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="saas-card p-5 max-w-md w-full space-y-4 border-cyan-500/30">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Add Task
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold">Start Time</label>
                  <input
                    type="text"
                    value={newTask.start_time}
                    onChange={(e) => setNewTask({ ...newTask, start_time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">End Time</label>
                  <input
                    type="text"
                    value={newTask.end_time}
                    onChange={(e) => setNewTask({ ...newTask, end_time: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
