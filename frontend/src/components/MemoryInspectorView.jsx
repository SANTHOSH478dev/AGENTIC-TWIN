import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  Bookmark, 
  History 
} from 'lucide-react';

const MemoryInspectorView = ({ memories, onAddMemory, onDeleteMemory }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMem, setNewMem] = useState({
    type: 'preference',
    key: '',
    value: '',
    relevance_tag: 'focus',
  });

  if (!memories) return <div className="p-8 text-center text-slate-400">Loading Memories...</div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMem.key || !newMem.value) return;
    onAddMemory(newMem);
    setShowAddForm(false);
    setNewMem({ type: 'preference', key: '', value: '', relevance_tag: 'focus' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="pdt-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            Inspectable Agentic Memory & Stable Preferences
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            User-editable operational rules, travel buffers, focus boundaries, and historical episodic outcomes.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Preference Rule</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="pdt-card p-6 border-cyan-500/40 space-y-4 text-sm bg-slate-900/90">
          <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Add New User Rule / Preference Parameter
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Memory Type</label>
              <select
                value={newMem.type}
                onChange={(e) => setNewMem({ ...newMem, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              >
                <option value="preference">Preference Rule</option>
                <option value="rule">Hard Operational Rule</option>
                <option value="episodic">Episodic Historical Log</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Key Name</label>
              <input
                type="text"
                required
                value={newMem.key}
                onChange={(e) => setNewMem({ ...newMem, key: e.target.value })}
                placeholder="e.g. evening_focus_boundary"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Category Tag</label>
              <input
                type="text"
                value={newMem.relevance_tag}
                onChange={(e) => setNewMem({ ...newMem, relevance_tag: e.target.value })}
                placeholder="focus, mobility, energy, finance"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Preference Rule Statement</label>
            <input
              type="text"
              required
              value={newMem.value}
              onChange={(e) => setNewMem({ ...newMem, value: e.target.value })}
              placeholder="e.g. Reserve 20 mins travel buffer before client meetings."
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Memory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((mem) => (
          <div key={mem.id} className="pdt-card p-5 space-y-3 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                  mem.type === 'rule' 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                    : mem.type === 'preference'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {mem.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{mem.relevance_tag}</span>
              </div>

              {mem.is_editable && (
                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 font-mono">{mem.key}</h4>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{mem.value}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <span className="text-emerald-400 font-medium">Active in Agent Context</span></span>
              <span>Created: {new Date(mem.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryInspectorView;
