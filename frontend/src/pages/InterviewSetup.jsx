import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Settings, Briefcase, Tag, Target, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InterviewSetup() {
  const [formData, setFormData] = useState({
    jobRole: 'Frontend Developer',
    domain: 'Software Engineering',
    difficulty: 'Intermediate',
    interviewType: 'Technical'
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5001/api/interviews/setup', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      navigate(`/interview/${data._id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to setup interview. Ensure backend and Gemini API are configured.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 mb-8 hover:text-gray-900 transition-colors font-medium">
          ← Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configure Interview</h1>
              <p className="text-gray-500 mt-1">Tailor the AI exactly to your targeted role.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Briefcase size={16} className="text-indigo-500" /> Job Role
                </label>
                <input 
                  type="text" 
                  value={formData.jobRole}
                  onChange={e => setFormData({ ...formData, jobRole: e.target.value })}
                  className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50"
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-indigo-500" /> Domain / Industry
                </label>
                <input 
                  type="text" 
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50"
                  placeholder="e.g. EdTech, FinTech"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Target size={16} className="text-indigo-500" /> Difficulty Level
                </label>
                <select 
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Zap size={16} className="text-indigo-500" /> Interview Type
                </label>
                <select 
                  value={formData.interviewType}
                  onChange={e => setFormData({ ...formData, interviewType: e.target.value })}
                  className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50"
                >
                  <option>Technical</option>
                  <option>Behavioral</option>
                  <option>Mixed</option>
                </select>
              </div>

            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={24} /> Generating Scenerios...</>
                ) : (
                  'Start Interview'
                )}
              </button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Make sure your camera and microphone are ready for the next step.
              </p>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  );
}
