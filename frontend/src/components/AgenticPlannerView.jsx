import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Check, 
  Award, 
  Sliders, 
  Info, 
  ArrowRight, 
  Brain, 
  Zap, 
  Clock, 
  CheckCircle 
} from 'lucide-react';

const AgenticPlannerView = ({ onGeneratePlans, candidatePlans, isLoading, onApplyPlan }) => {
  const [goalPrompt, setGoalPrompt] = useState(
    'Optimize my schedule for high-cognitive focus while maintaining travel buffers and keeping budget spend under $40.'
  );

  const [weights, setWeights] = useState({
    alpha_completion: 0.35,
    beta_efficiency: 0.25,
    gamma_feasibility: 0.25,
    delta_intervention: 0.15,
  });

  const presetGoals = [
    'Maximize morning focus & deep work',
    'Minimize daily budget spend & travel',
    'Balance meeting load with rest breaks',
  ];

  const handleGenerate = (e) => {
    e.preventDefault();
    onGeneratePlans({
      goal_prompt: goalPrompt,
      ...weights,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="pdt-card p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Agentic AI Multi-Resource Planner</h2>
            <p className="text-sm text-slate-400">
              Decomposes user daily goals, evaluates hard & soft constraints, and computes deterministic utility score $U(P)$.
            </p>
          </div>
        </div>

        {/* Goal Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Daily Goal Prompt</label>
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={goalPrompt}
                onChange={(e) => setGoalPrompt(e.target.value)}
                placeholder="Describe your daily planning target..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Generating Plans...' : 'Generate Plans'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-medium py-1">Quick Presets:</span>
            {presetGoals.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoalPrompt(preset)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Paper Formula Weights Slider Accordion */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Utility Score Weights: U(P) = α·C(P) + β·R(P) + γ·F(P) - δ·I(P)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-400 flex justify-between">
                  <span>α (Completion C)</span>
                  <span className="text-cyan-400">{weights.alpha_completion}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={weights.alpha_completion}
                  onChange={(e) => setWeights({ ...weights, alpha_completion: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 flex justify-between">
                  <span>β (Efficiency R)</span>
                  <span className="text-emerald-400">{weights.beta_efficiency}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={weights.beta_efficiency}
                  onChange={(e) => setWeights({ ...weights, beta_efficiency: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-emerald-400"
                />
              </div>

              <div>
                <label className="text-slate-400 flex justify-between">
                  <span>γ (Feasibility F)</span>
                  <span className="text-purple-400">{weights.gamma_feasibility}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={weights.gamma_feasibility}
                  onChange={(e) => setWeights({ ...weights, gamma_feasibility: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-purple-400"
                />
              </div>

              <div>
                <label className="text-slate-400 flex justify-between">
                  <span>δ (Intervention I)</span>
                  <span className="text-amber-400">{weights.delta_intervention}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.4"
                  step="0.05"
                  value={weights.delta_intervention}
                  onChange={(e) => setWeights({ ...weights, delta_intervention: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-amber-400"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Generated Candidate Plans Grid */}
      {candidatePlans && candidatePlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Evaluated Candidate Daily Plans ({candidatePlans.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidatePlans.map((plan) => (
              <div
                key={plan.id}
                className={`pdt-card p-6 flex flex-col justify-between space-y-4 relative ${
                  plan.is_recommended ? 'border-cyan-500/60 bg-cyan-950/10 pdt-card-active' : ''
                }`}
              >
                {/* Recommended Badge */}
                {plan.is_recommended && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Recommended Plan
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-slate-100">{plan.plan_name}</h4>

                  {/* Utility Score Gauge */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">Overall Utility Score U(P)</span>
                    <span className={`text-xl font-extrabold ${plan.is_recommended ? 'text-cyan-400 pdt-glow-cyan' : 'text-slate-200'}`}>
                      {plan.utility_score.toFixed(1)} / 100
                    </span>
                  </div>

                  {/* Score Breakdown Radar/Progress */}
                  <div className="space-y-2 text-xs pt-2">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Task Completion C(P)</span>
                        <span className="text-cyan-400 font-bold">{plan.completion_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full" style={{ width: `${plan.completion_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Resource Efficiency R(P)</span>
                        <span className="text-emerald-400 font-bold">{plan.resource_efficiency}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${plan.resource_efficiency}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Feasibility & Buffers F(P)</span>
                        <span className="text-purple-400 font-bold">{plan.feasibility_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full" style={{ width: `${plan.feasibility_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Intervention Effort I(P)</span>
                        <span className="text-amber-400 font-bold">{plan.intervention_cost}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full" style={{ width: `${plan.intervention_cost}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Trade-off Explanation Box */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Trade-off Justification:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{plan.explanation}</p>
                  </div>
                </div>

                <button
                  onClick={() => onApplyPlan(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                    plan.is_recommended
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Select & Apply Plan</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenticPlannerView;
