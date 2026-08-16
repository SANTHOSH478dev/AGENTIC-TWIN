import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/api';
import { 
  Send, 
  Sparkles, 
  Cpu, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  CornerDownRight, 
  BookOpen 
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "How much did I spend last month?",
  "Where did my money go this month?",
  "Predict my next month's expenses.",
  "Show unusual spending.",
  "What is my highest spending category?",
  "Show my recurring subscriptions.",
  "How much did I spend on weekends?",
  "Suggest an optimized budget proposal.",
  "Verify my emergency fund status.",
  "How is my savings rate calculated?",
  "Analyze my grocery expenditure trend.",
  "List all manual category corrections."
];

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState({});
  
  const chatBottomRef = useRef(null);

  // Load chat session history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await aiService.getHistory();
        if (history.length > 0) {
          const lastSession = history[0];
          setSessionId(lastSession.id);
          setMessages(lastSession.messages || []);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', message: userText, id: Date.now() }]);

    try {
      const data = await aiService.chat(userText, sessionId);
      setSessionId(data.session_id);
      setMessages(prev => [...prev, data.message]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        message: "I encountered a connection error. Ensure backend is running.",
        id: Date.now() + 1
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleInsight = (msgId) => {
    setExpandedInsights(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[78vh] min-h-[500px] animate-in fade-in duration-300">
      
      {/* Suggestions Sidebar */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 hidden lg:flex flex-col gap-5 bg-[#090d1f]/20 shadow-xl overflow-y-auto">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Suggested Queries</h3>
        </div>
        
        <div className="space-y-2 flex-1">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-left text-xs bg-slate-900/40 hover:bg-slate-800/70 border border-slate-850 hover:border-slate-700/60 text-slate-400 hover:text-white p-3.5 rounded-xl transition-all w-full leading-relaxed disabled:opacity-50 font-medium"
            >
              {q}
            </button>
          ))}
        </div>
        
        <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-950/30 p-4 rounded-xl border border-slate-900">
          <p className="font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
            Isolated Querying
          </p>
          AI-generated financial analytics based on uploaded transaction data. Answers are verified and informational.
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="lg:col-span-3 glass-panel border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden bg-[#090d1f]/10 shadow-xl relative">
        
        {/* Messages viewport */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
              <div className="w-12 h-12 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center text-brand-500 shadow-lg shadow-brand-500/5 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">Explainable AI Chatbot</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ask conversational questions about your financial history. The AI routes queries to predefined calculation tools.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id || m.created_at} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2.5`}>
                  
                  {/* Msg Bubble */}
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-lg shadow-brand-600/10 font-medium' 
                      : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none font-medium'
                  }`}>
                    <div className="whitespace-pre-line">{m.message}</div>
                  </div>

                  {/* Explainability Cards & Tool logs */}
                  {!isUser && m.response_metadata && (
                    <div className="w-full max-w-[85%] space-y-2.5 pl-3">
                      
                      {/* Tool Log Badge */}
                      {m.tools_called && m.tools_called.map((toolLog, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                          <Cpu className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="font-semibold uppercase tracking-wider">Executed Tool:</span>
                          <code className="bg-slate-900 border border-slate-850 text-brand-400 px-2 py-0.5 rounded font-mono text-[9px]">
                            {toolLog.tool}({JSON.stringify(toolLog.args)})
                          </code>
                          <span className="flex items-center gap-0.5 text-slate-650 font-bold">
                            <Clock className="w-3 h-3" />
                            {toolLog.latency_ms}ms
                          </span>
                        </div>
                      ))}

                      {/* Why this insight? details drawer */}
                      {m.response_metadata.why_insight && (
                        <div className="border border-slate-850/60 rounded-xl overflow-hidden bg-slate-950/20">
                          <button
                            onClick={() => toggleInsight(m.id)}
                            className="flex items-center justify-between w-full p-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              Why this insight? (Explainable AI)
                            </span>
                            {expandedInsights[m.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          
                          {expandedInsights[m.id] && (
                            <div className="p-4 border-t border-slate-850/40 text-xs text-slate-450 bg-slate-950/50 space-y-3 leading-relaxed">
                              <p className="text-[11px] font-medium">{m.response_metadata.why_insight}</p>
                              {m.response_metadata.result_summary && (
                                <div className="space-y-1.5">
                                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Grounded Tool Payload Data:</span>
                                  <pre className="bg-slate-900/80 p-3 rounded-lg border border-slate-850 font-mono text-[9px] overflow-x-auto text-brand-400">
                                    {JSON.stringify(m.response_metadata.result_summary, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex flex-col items-start space-y-2">
              <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="p-4 border-t border-slate-800 flex items-center gap-3 bg-dark-900/40 backdrop-blur-md sticky bottom-0 z-10">
          <input
            type="text"
            placeholder="Type a financial question (e.g. 'Compare this month with last month')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-dark-950/80 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-brand-600 hover:bg-brand-500 text-white p-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-brand-600/10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
