import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  X, 
  Sparkles, 
  Bot, 
  Send, 
  Wrench,
  Brain,
  Square,
  Trash2
} from 'lucide-react';
import { sendVoiceCommand, getConversationHistory, clearConversationHistory } from '../services/api';

const VoiceAssistantModal = ({ isOpen, onClose, onScheduleChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const recognitionRef = useRef(null);

  // Load history on open
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = () => {
    getConversationHistory('default_session')
      .then(history => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              sender: 'assistant',
              text: "Hi! I am your Universal AI Assistant. Ask questions, solve problems, or automate tasks.",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      })
      .catch(() => {});
  };

  const handleClearContext = async () => {
    try {
      await clearConversationHistory('default_session');
      setMessages([
        {
          sender: 'assistant',
          text: 'Conversation history cleared. Context reset.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  // Web Speech API STT
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setStatusText('Listening...');
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceQuery(transcript);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setStatusText('Ready');
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Web Speech Synthesis TTS (Clean prose only)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code generated.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => { setIsSpeaking(true); setStatusText('Speaking...'); };
      utterance.onend = () => { setIsSpeaking(false); setStatusText('Ready'); };
      utterance.onerror = () => { setIsSpeaking(false); setStatusText('Ready'); };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setStatusText('Ready');
    }
  };

  const handleVoiceQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setTextInput('');
    setStatusText('Thinking...');

    try {
      const res = await sendVoiceCommand(queryText, 'default_session');

      const assistantMsg = {
        sender: 'assistant',
        text: res.voice_response,
        tool_calls: res.action_details?.executed_tools || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);

      speakText(res.voice_response);

      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (err) {
      const errMsg = {
        sender: 'assistant',
        text: "I understood your request, but the service encountered an error processing it. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
      setStatusText('Ready');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatusText('Ready');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert('Browser microphone input is not available. You can type any question below!');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="saas-card p-5 max-w-2xl w-full space-y-4 border-cyan-500/40 bg-[#0c1220]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 text-slate-950 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">AI Assistant</h3>
              <p className="text-[11px] text-slate-400">Ask questions, solve problems, and automate tasks.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearContext}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs flex items-center gap-1"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Context
            </button>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-rose-300" /> Stop Speech
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-rose-400 animate-ping' : isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}></span>
            <span className="text-slate-300 font-medium">Status: <span className="text-cyan-400 font-mono font-bold">{statusText}</span></span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">General AI Brain</span>
        </div>

        {/* Conversation Stream */}
        <div className="h-80 overflow-y-auto space-y-3 p-2 scrollbar-thin">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-xl text-xs leading-relaxed space-y-1 ${
                m.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap font-sans">
                  {m.text}
                </div>

                {m.tool_calls && m.tool_calls.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Executed Tool: {m.tool_calls.map(tc => tc.tool).join(', ')}
                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right font-mono">{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Clean Input Bar: Microphone | Input box ("Ask anything...") | Send button */}
        <div className="pt-2 border-t border-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); handleVoiceQuery(textInput); }} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-rose-500 text-slate-950 border-rose-400 animate-pulse' 
                  : 'bg-slate-900 text-cyan-400 border-slate-800 hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop Listening' : 'Click to Speak'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
