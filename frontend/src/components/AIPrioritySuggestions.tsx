'use client';

import { useState } from 'react';
import { AlertCircle, Zap, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface Suggestion {
  id: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export function AIPrioritySuggestions({ token }: { token: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      // 'api' instance lib/api.ts se aata hai — base URL wahi se manage hota hai,
      // isliye deployment ke time sirf ek jagah (lib/api.ts) change karni padegi,
      // yaha hardcoded localhost URL nahi rakhna padega
      const response = await api.get(
        '/api/complaints/priorities/suggest',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(response.data.suggestions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch suggestions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'HIGH') return <AlertCircle className="w-4 h-4" />;
    if (priority === 'MEDIUM') return <TrendingUp className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-secondary">🤖 AI Priority Suggestions</h3>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 font-semibold transition"
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze Cases'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4 border border-red-300">
          ❌ {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-600 font-semibold mb-4">Found {suggestions.length} cases to prioritize:</p>
          {suggestions.map((sugg) => (
            <div
              key={sugg.id}
              className={`p-4 rounded-lg border-l-4 flex items-center gap-4 ${getPriorityColor(
                sugg.priority
              )}`}
            >
              <div className="text-2xl">
                {getPriorityIcon(sugg.priority)}
              </div>
              <div className="flex-1">
                <p className="font-bold">Case #{sugg.id}</p>
                <p className="text-sm opacity-75">{sugg.reason}</p>
              </div>
              <span className="font-bold text-lg px-3 py-1 bg-white/50 rounded">
                {sugg.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">
            📌 Click "Analyze Cases" button to get AI-powered priority suggestions for pending cases
          </p>
        </div>
      )}
    </div>
  );
}