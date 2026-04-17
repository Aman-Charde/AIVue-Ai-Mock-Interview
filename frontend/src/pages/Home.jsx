import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Brain, Camera, Mic, BarChart, ArrowRight } from 'lucide-react';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let res;
    if (isLogin) {
      res = await login(email, password);
    } else {
      res = await register(name, email, password);
    }
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center relative overflow-hidden text-white font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-blue-500/30 to-teal-500/30 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 flex flex-col gap-6"
          >
            <h1 className="text-5xl lg:text-7xl font-bold font-heading leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Master Your <br /> Next Interview <br /> with AIVue.
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 font-light leading-relaxed max-w-lg">
              Practice job interviews in a realistic, AI-powered environment. Experience live video, speech analysis, and instant scoring to elevate your career confidence.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400"><Brain size={24} /></div>
                <div className="text-sm font-medium">Smart AI Questions</div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-3 bg-teal-500/20 rounded-lg text-teal-400"><Camera size={24} /></div>
                <div className="text-sm font-medium">Live Video Environment</div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400"><Mic size={24} /></div>
                <div className="text-sm font-medium">Voice Analysis</div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400"><BarChart size={24} /></div>
                <div className="text-sm font-medium">Deep Performance Stats</div>
              </div>
            </div>
          </motion.div>

          {/* Auth Form Form */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-5/12 ml-auto"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-gray-400 text-sm">Enter the portal to begin your preparation journey.</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:gap-4 transition-all"
                >
                  {isLogin ? 'Sign In' : 'Get Started'} <ArrowRight size={20} />
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
