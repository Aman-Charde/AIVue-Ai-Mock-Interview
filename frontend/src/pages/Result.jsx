import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle, Target, ArrowLeft, BarChart3, MessageSquare, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Result() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await axios.get(`https://aivue-backend.onrender.com/api/interviews/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setInterview(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchResult();
  }, [id, user.token]);

  if (!interview) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl font-medium text-gray-500 animate-pulse">Analyzing your final report...</div>
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 mb-8 hover:text-gray-900 flex items-center gap-2 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-4 py-1.5 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
                <CheckCircle size={16} /> Interview Report
              </div>
              <h1 className="text-4xl font-bold mb-2">{interview.jobRole}</h1>
              <p className="text-indigo-200 text-lg">{interview.domain} • {interview.difficulty}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center min-w-[200px] shadow-2xl">
              <span className="text-gray-500 font-semibold mb-1 uppercase tracking-wider text-sm">Overall Performance</span>
              <div className={`text-6xl font-black ${getScoreColor(interview.overallScore)}`}>
                {Math.round(interview.overallScore)}%
              </div>
            </div>
          </div>

          <div className="p-10">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="text-indigo-600" /> Evaluation Results
            </h2>

            <div className="space-y-12">
              {interview.questions.map((q, idx) => (
                <div key={q._id || idx} className="border border-gray-100 rounded-3xl p-8 bg-gray-50/50 relative border-l-4 border-l-indigo-500">
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {idx + 1}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-6">{q.questionText}</h3>
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={14} /> Your Answer
                    </div>
                    <p className="text-gray-700 leading-relaxed italic">"{q.userAnswer || 'No response provided.'}"</p>
                  </div>

                  {q.evaluation ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Topic Score</div>
                        <div className={`text-4xl font-black ${getScoreColor(q.evaluation.score * 10)}`}>{q.evaluation.score}/10</div>
                      </div>
                      
                      <div className="md:col-span-3 space-y-4">
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Target size={16} /> Feedback</h4>
                          <p className="text-indigo-800 text-sm leading-relaxed">{q.evaluation.feedback}</p>
                        </div>
                        
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                          <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2"><Award size={16} /> Key Improvements</h4>
                          <ul className="list-disc pl-5 text-green-800 text-sm space-y-1">
                            {q.evaluation.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700">
                      <AlertCircle size={20} />
                      <p className="text-sm font-medium">Evaluation pending for this response.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
