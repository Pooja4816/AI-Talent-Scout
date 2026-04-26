import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function JobInput() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jd.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/match', { jd });
      navigate('/results', { state: { jd, results: response.data } });
    } catch (err) {
      console.error(err);
      setError('Failed to analyze job description. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative group z-20">
      {/* Absolute Glow behind the form */}
      <div className={`absolute -inset-1 rounded-3xl blur-xl transition-all duration-1000 opacity-30 ${isFocused ? 'bg-gradient-to-r from-primary-500 via-teal-400 to-emerald-500 opacity-60' : 'bg-dark-700'}`}></div>
      
      <form onSubmit={handleAnalyze} className="relative glass-effect rounded-3xl p-2 flex flex-col gap-2">
        <div className="p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
             <FileText className="w-5 h-5 text-primary-400" />
           </div>
            <label htmlFor="jd" className="text-lg font-semibold tracking-tight text-white drop-shadow-md">
              Paste Job Description
            </label>
          </div>
          <div className="relative">
            <textarea
              id="jd"
              rows={6}
              value={jd}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setJd(e.target.value)}
              disabled={loading}
              placeholder="e.g. We are looking for a Senior Full Stack Engineer with 5+ years of experience in React, Node.js, and MongoDB..."
              className="w-full bg-dark-900/50 backdrop-blur-md shadow-inner border border-dark-600 rounded-2xl p-5 text-slate-100 placeholder:text-slate-500/70 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 transition-all resize-y text-lg leading-relaxed z-10 relative"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-sm bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </motion.div>
          )}
        </div>

        <div className="px-2 pb-2">
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading || !jd.trim()}
            type="submit"
            className="w-full relative overflow-hidden bg-gradient-to-r from-primary-600 via-emerald-500 to-teal-500 hover:from-primary-500 hover:via-emerald-400 hover:to-teal-400 text-white font-bold text-lg py-5 px-6 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            {/* Glossy overlay hit area */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
            
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin drop-shadow-md" />
                <span className="drop-shadow-md tracking-tight">Analyzing AI Pattern Synthesis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 drop-shadow-md group-hover/btn:animate-pulse" />
                <span className="drop-shadow-md tracking-tight">Find Best Candidates matching JD</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
