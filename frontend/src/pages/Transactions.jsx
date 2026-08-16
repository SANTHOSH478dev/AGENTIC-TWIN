import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import { Search, Filter, AlertCircle, Edit, ArrowDown, ArrowUp, Check } from 'lucide-react';

const CATEGORIES = [
  "Food & Dining", "Groceries", "Transportation", "Shopping", 
  "Entertainment", "Utilities", "Rent", "Healthcare", "Education", 
  "Travel", "Subscriptions", "EMI / Loans", "Insurance", "Investment", 
  "Salary", "Business Income", "Transfer", "Cash Withdrawal", "Other"
];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchMerchant, setSearchMerchant] = useState('');
  
  // Edit category states
  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll({
        category: categoryFilter || undefined,
        transaction_type: typeFilter || undefined,
        merchant: searchMerchant || undefined,
        limit: 100
      });
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [categoryFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions();
  };

  const handleCategoryChange = async (id, newCat) => {
    try {
      const updated = await transactionService.updateCategory(id, newCat);
      setTransactions(transactions.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update transaction category", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Bar */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#090d1f]/20">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search merchant name..."
            value={searchMerchant}
            onChange={(e) => setSearchMerchant(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-dark-950/85 border border-slate-800 text-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-dark-950/85 border border-slate-800 text-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Types</option>
            <option value="DEBIT">Expense (Debits)</option>
            <option value="CREDIT">Income (Credits)</option>
          </select>
        </div>
      </div>

      {/* Grid Ledger Table */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl bg-[#090d1f]/10">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
            <p>No matching transactions found in your records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Merchant</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Classification Method</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300 font-medium">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap text-slate-400">{t.transaction_date}</td>
                    <td className="py-4 px-6 max-w-xs truncate text-slate-300" title={t.raw_description}>
                      {t.clean_description || t.raw_description}
                    </td>
                    <td className="py-4 px-6 truncate font-bold text-white">{t.merchant || 'Other'}</td>
                    <td className="py-4 px-6">
                      {editingId === t.id ? (
                        <select
                          value={editingCategory}
                          onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          className="bg-dark-950 border border-slate-700 text-white rounded px-2 py-1 text-[10px] focus:ring-1 focus:ring-brand-500"
                          autoFocus
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => {
                          setEditingId(t.id);
                          setEditingCategory(t.category);
                        }}>
                          <span className="bg-slate-900/40 text-slate-300 px-2.5 py-0.5 rounded border border-slate-800 group-hover:border-slate-600 transition-colors">
                            {t.category}
                          </span>
                          <Edit className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 uppercase tracking-wider text-[9px] font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full border ${
                        t.classification_method === 'manual' ? 'bg-orange-500/5 border-orange-500/15 text-orange-400' :
                        t.classification_method === 'ml' ? 'bg-blue-500/5 border-blue-500/15 text-blue-400' :
                        'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {t.classification_method} {t.confidence < 1.0 && t.classification_method === 'ml' && `(${Math.round(t.confidence*100)}%)`}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-extrabold text-xs ${
                      t.transaction_type === 'CREDIT' ? 'text-emerald-500' : 'text-slate-200'
                    }`}>
                      <span className="flex items-center justify-end gap-1">
                        {t.transaction_type === 'CREDIT' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-500" />}
                        ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
