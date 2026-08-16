import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MessageSquareCode, Sparkles, PieChart, ShieldCheck, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';

const LandingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [openFaq, setOpenFaq] = useState(null); // stores active FAQ index

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the hybrid categorization engine work?",
      a: "The engine processes statements in two layers. Layer 1 uses regex rule matching to scan direct notations. If no match matches, Layer 2 feeds clean description strings to a localized TF-IDF + Logistic Regression ML pipeline."
    },
    {
      q: "Is my transaction data safe from AI model leaks?",
      a: "Yes. The AI assistant uses secure, predefined database tools to fetch aggregate balances. The LLM never directly query SQL or access raw logs, and all parameters are strictly sandboxed using JWT token authentication."
    },
    {
      q: "Can I retrain the models with my own adjustments?",
      a: "Absolutely. If you correct a transaction's category, the system logs the adjustment. You can trigger retraining from the ML Center to refit vectorizer decision weights to your customizations."
    },
    {
      q: "What models are used for monthly forecasting?",
      a: "We compare a 3-month Moving Average baseline against a Linear Regression trend model. The system performs walk-forward backtests on historical logs, selecting the model with the lowest Mean Absolute Error (MAE)."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans overflow-x-hidden relative selection:bg-[#3b82f6] selection:text-white">
      
      {/* Background Animated Spotlight Blobs for Visual Depth */}
      <div className="absolute top-0 left-0 w-full h-[1000px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[70%] bg-blue-600/5 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[10%] right-[-15%] w-[50%] h-[60%] bg-emerald-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '12s' }}></div>
      </div>

      {/* 1. Sticky Navbar */}
      <header className="w-full h-16 border-b border-slate-800 bg-[#131824]/90 backdrop-blur-md sticky top-0 z-50 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-8 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-[26px] h-[26px] rounded-lg bg-[#3b82f6] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="text-white w-3.5 h-3.5" />
            </div>
            <span className="text-[14px] font-semibold text-white tracking-tight">CashFlow AI</span>
          </div>

          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              to="/login" 
              className="text-[13px] font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 border border-slate-800 rounded-lg hover:bg-slate-900/40"
            >
              Sign in
            </Link>
            <Link 
              to="/register" 
              className="text-[13px] font-bold bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3.5 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 pt-16 pb-10 flex flex-col items-center justify-center text-center space-y-6">
        
        {/* Small Pill Badge with hover scale */}
        <div className="inline-flex items-center gap-2 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-full px-3 py-1.5 text-[12px] text-[#3b82f6] font-semibold hover:scale-105 transition-transform cursor-default">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable AI-powered personal finance</span>
        </div>
        
        {/* Large Headline */}
        <h1 className="text-[36px] md:text-[44px] font-extrabold tracking-tight text-white leading-tight max-w-[680px] mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
          Conversational analytics for <br />
          <span className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">your money</span>
        </h1>

        {/* Subheadline */}
        <p className="text-[14px] text-slate-400 max-w-[460px] mx-auto leading-relaxed">
          Upload statements, categorize transactions with hybrid rules and ML, and converse with your money using a secure, tool-grounded assistant.
        </p>

        {/* Two CTA Buttons side-by-side */}
        <div className="pt-2 flex flex-row items-center justify-center gap-3">
          <Link 
            to="/register" 
            className="flex items-center gap-1.5 text-xs font-bold bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-3.5 rounded-lg transition-all duration-200 transform hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/15"
          >
            Create free account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a 
            href="#features" 
            className="text-xs font-bold bg-[#131824] border border-slate-800 hover:bg-slate-800 text-white px-5 py-3.5 rounded-lg transition-all duration-200"
          >
            Explore features
          </a>
        </div>

        {/* 3. Product Mockup Section (HTML/CSS Dashboard Preview) with spotlight back-glow */}
        <div className="pt-10 w-full max-w-[540px] mx-auto relative group">
          <div className="absolute inset-0 bg-[#3b82f6]/5 rounded-2xl blur-xl group-hover:bg-[#3b82f6]/10 transition-colors duration-500 pointer-events-none"></div>
          
          <div className="bg-[#131824] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 relative z-10 transition-all duration-300 group-hover:border-slate-700/60">
            
            {/* Header Row */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Cash flow overview</span>
              <span className="text-[10px] text-slate-500 font-medium">July 2026</span>
            </div>

            {/* Bar Chart (6 bars, varying heights, accent blue, one highlighted brighter) */}
            <div className="h-28 flex items-end justify-between px-4 pt-4">
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-4 bg-[#3b82f6]/30 rounded-t group-hover:bg-[#3b82f6]/40 transition-colors" style={{ height: '35px' }}></div>
                <span className="text-[8px] text-slate-500 font-bold">Jan</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-4 bg-[#3b82f6]/30 rounded-t group-hover:bg-[#3b82f6]/40 transition-colors" style={{ height: '55px' }}></div>
                <span className="text-[8px] text-slate-500 font-bold">Feb</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                {/* Highlighted brighter blue bar with glowing shadow */}
                <div className="w-4 bg-[#3b82f6] rounded-t shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" style={{ height: '80px' }}></div>
                <span className="text-[8px] text-[#3b82f6] font-bold">Mar</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-4 bg-[#3b82f6]/30 rounded-t group-hover:bg-[#3b82f6]/40 transition-colors" style={{ height: '45px' }}></div>
                <span className="text-[8px] text-slate-500 font-bold">Apr</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-4 bg-[#3b82f6]/30 rounded-t group-hover:bg-[#3b82f6]/40 transition-colors" style={{ height: '70px' }}></div>
                <span className="text-[8px] text-slate-500 font-bold">May</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-8">
                <div className="w-4 bg-[#3b82f6]/30 rounded-t group-hover:bg-[#3b82f6]/40 transition-colors" style={{ height: '60px' }}></div>
                <span className="text-[8px] text-slate-500 font-bold">Jun</span>
              </div>
            </div>

            {/* Footer Row (two stat blocks) */}
            <div className="pt-3 border-t border-slate-800 flex justify-between text-left">
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Net worth</span>
                <p className="text-white font-extrabold text-[12px] mt-0.5">$287,500</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Health score</span>
                <p className="text-emerald-500 font-extrabold text-[12px] mt-0.5">8.4 / 10</p>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Metrics Row (SaaS proof markers) */}
      <section className="relative z-10 py-6 bg-[#131824]/40 border-y border-slate-850/80">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-lg md:text-xl font-extrabold text-[#3b82f6]">₹4.8M+</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Statement Volume Cleaned</p>
          </div>
          <div className="border-x border-slate-800">
            <p className="text-lg md:text-xl font-extrabold text-white">99.4%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Classification Accuracy</p>
          </div>
          <div>
            <p className="text-lg md:text-xl font-extrabold text-white">12ms</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Calculation Latency</p>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="border-t border-slate-800 bg-[#131824] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-[18px] font-extrabold tracking-tight text-white uppercase tracking-wider">
              Full-stack intelligence architecture
            </h2>
            <p className="text-slate-400 text-[11px] max-w-md mx-auto leading-relaxed">
              Everything you need to master your monthly cash flow, backed by rigorous experimental research analytics.
            </p>
          </div>

          {/* 3-Column Card Grid (equal width, 16px gap) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#1a2133] border border-slate-850 p-6 rounded-xl space-y-4 hover:border-[#3b82f6]/40 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-[34px] h-[34px] rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-all duration-300">
                <MessageSquareCode className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-white group-hover:text-[#3b82f6] transition-colors">Grounded conversational AI</h3>
                <p className="text-slate-400 text-[12px] leading-normal">
                  Talk to your transactions. Predefined DB tools fetch correct calculations safely with zero hallucination. No direct SQL queries.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1a2133] border border-slate-850 p-6 rounded-xl space-y-4 hover:border-[#3b82f6]/40 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-[34px] h-[34px] rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-all duration-300">
                <PieChart className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-white group-hover:text-[#3b82f6] transition-colors">Hybrid ML categorization</h3>
                <p className="text-slate-400 text-[12px] leading-normal">
                  Regex rule matching layered with a TF-IDF + Logistic Regression model. Captures unique bank notations with automatic user correction retraining.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1a2133] border border-slate-850 p-6 rounded-xl space-y-4 hover:border-[#3b82f6]/40 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="w-[34px] h-[34px] rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[14px] font-bold text-white group-hover:text-[#3b82f6] transition-colors">Isolation and security built-in</h3>
                <p className="text-slate-400 text-[12px] leading-normal">
                  Bcrypt password verification, strict JWT authorization, and complete database level owner-isolation. Your banking secrets remain yours alone.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="border-t border-slate-800 bg-[#0a0e17] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <h2 className="text-[18px] font-extrabold tracking-tight text-white uppercase tracking-wider">
              Simple, transparent plans
            </h2>
            <p className="text-slate-400 text-[11px] max-w-md mx-auto leading-relaxed">
              No hidden parameters. Choose the pricing level that matches your analytics requirements.
            </p>
            
            {/* Interactive Billing toggle (Monthly/Yearly) */}
            <div className="pt-2 flex justify-center items-center">
              <div className="bg-[#131824] border border-slate-800 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors ${
                    billingCycle === 'monthly' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    billingCycle === 'yearly' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="bg-[#10b981] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Save 20%</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Plan 1 */}
            <div className="bg-[#131824] border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Starter</h3>
                <p className="text-[24px] font-extrabold text-white">₹0 <span className="text-xs text-slate-500 font-medium">/ month</span></p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Perfect for simple ledger cleaning and spending overview.</p>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Standard CSV statement parsing</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> 19 default category predictions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> AI chatbot limits (10 queries/mo)</li>
              </ul>
              <Link to="/register" className="w-full text-center py-2.5 bg-[#1a2133] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors">
                Get started
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="bg-[#131824] border-2 border-[#3b82f6] p-6 rounded-xl flex flex-col justify-between space-y-6 relative hover:scale-[1.01] transition-transform">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#3b82f6] text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                Most Popular
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Professional</h3>
                <p className="text-[24px] font-extrabold text-white">
                  {billingCycle === 'monthly' ? '₹999' : '₹799'} 
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Complete forecasting, retraining dashboards, and security audits.</p>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Unlimited statement ingestion</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Custom ML model retraining</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Unlimited AI Assistant tools queries</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Scenario playground & security logs</li>
              </ul>
              <Link to="/register" className="w-full text-center py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-blue-500/10">
                Try Pro free
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#131824] border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enterprise</h3>
                <p className="text-[24px] font-extrabold text-white">Custom <span className="text-xs text-slate-500 font-medium"></span></p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Tailored parameters for financial teams and multi-account managers.</p>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-350">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Dedicated PostgreSQL migrations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> REST API sandbox endpoints</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" /> Custom training vector weights</li>
              </ul>
              <a href="mailto:support@cashflow-ai.com" className="w-full text-center py-2.5 bg-[#1a2133] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors">
                Contact sales
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 6. About/FAQ Section (Interactive Accordion layout) */}
      <section id="about" className="border-t border-slate-800 bg-[#131824] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-[18px] font-extrabold tracking-tight text-white uppercase tracking-wider">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-[11px] max-w-md mx-auto leading-relaxed">
              Find instant answers to architecture and security specifications.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-[#1a2133] rounded-xl border border-slate-850/80 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4.5 text-left text-xs font-bold text-white hover:text-[#3b82f6] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#3b82f6]" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 text-[11px] text-slate-400 leading-relaxed border-t border-slate-850/50 pt-3.5 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-800 py-5 bg-[#0a0e17] mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <p className="text-[11px] text-slate-500 font-medium tracking-wide">
            © 2026 CashFlow AI Personal Finance System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
