import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Plus, Clock, Award, ChevronRight, TrendingUp, CheckCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const { data } = await axios.get('https://aivue-backend.onrender.com/api/interviews', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setInterviews(data);
      } catch (error) {
        console.error('Failed to fetch interviews');
      }
    };
    fetchInterviews();
  }, [user.token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Metrics Logic
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const completionRate = interviews.length > 0 ? Math.round((completedInterviews.length / interviews.length) * 100) : 0;
  const avgScore = interviews.length > 0 ? Math.round(interviews.reduce((a, b) => a + (b.overallScore || 0), 0) / interviews.length) : 0;

  let improvementMatch = 0;
  if (completedInterviews.length > 1) {
    const sorted = [...completedInterviews].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const firstScore = sorted[0].overallScore || 0;
    const lastScore = sorted[sorted.length-1].overallScore || 0;
    if (firstScore > 0) {
      improvementMatch = Math.round(((lastScore - firstScore) / firstScore) * 100);
    } else {
      improvementMatch = lastScore > 0 ? 100 : 0;
    }
  }



  const chartData = [...completedInterviews].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map((inv, i) => ({
    name: `S${i + 1}`,
    score: Math.round(inv.overallScore || 0),
    date: new Date(inv.createdAt).toLocaleDateString()
  }));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            AIVue.
          </div>
          <div className="flex items-center gap-6">
            <span className="font-medium text-gray-600 items-center gap-2 hidden md:flex">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {user?.name}
            </span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2">
              <LogOut size={20} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to your Dashboard</h1>
            <p className="text-gray-500">Track your progress and start new interview sessions.</p>
          </div>
          <Link to="/setup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30">
            <Plus size={20} /> New Interview
          </Link>
        </div>

        {/* Top Progress Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Taken</p>
              <h3 className="text-2xl font-bold">{interviews.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completion</p>
              <h3 className="text-2xl font-bold">{completionRate}%</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Award size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg. Score</p>
              <h3 className="text-2xl font-bold">{avgScore}%</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Improvement</p>
              <h3 className="text-2xl font-bold">{improvementMatch > 0 ? `+${improvementMatch}` : improvementMatch}%</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {completedInterviews.length > 0 && (
          <div className="grid grid-cols-1 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-indigo-600" />
                <h3 className="text-xl font-bold">Learning Progress</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#4F46E5" 
                      strokeWidth={3}
                      dot={{r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: 'white'}}
                      activeDot={{r: 6}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>


          </div>
        )}

        <h2 className="text-xl font-bold mb-6">Recent Interviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {interviews.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-300 rounded-2xl">
              <p className="text-gray-500 mb-4">You haven't taken any interviews yet.</p>
              <Link to="/setup" className="text-indigo-600 font-medium hover:underline">Start your first interview</Link>
            </div>
          ) : (
            interviews.slice().reverse().map((interview, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={interview._id} 
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => navigate(interview.status === 'completed' ? `/result/${interview._id}` : `/interview/${interview._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{interview.jobRole}</h3>
                    <p className="text-gray-500 text-sm">{interview.domain} • {interview.difficulty}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    interview.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {interview.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-400">
                    {new Date(interview.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}
                  </div>
                  <div className="flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
