import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, LayoutGrid, Sparkles } from 'lucide-react';
import CandidateCard from '../components/CandidateCard';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jd, results } = location.state || {};

  if (!results) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] relative z-10 w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -z-10 mix-blend-screen"></div>
        <Sparkles className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
        <p className="text-xl text-slate-400 font-medium tracking-tight">No results synthesized.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 rounded-xl btn-premium text-primary-400 font-semibold flex items-center gap-2 hover:text-primary-300">
          <ArrowLeft className="w-5 h-5" />
          Return to Input Interface
        </button>
      </div>
    );
  }

  const { jdSkills, candidates } = results;

  return (
    <div className="flex-1 flex flex-col p-6 md:p-12 w-full max-w-7xl mx-auto relative z-10">
      
      {/* Background glow for Results */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none"></div>

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-dark-700/50 pb-6">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit mb-4 group"
          >
            <div className="p-1 rounded bg-dark-800 border border-dark-700 group-hover:bg-dark-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium tracking-wide text-sm uppercase">Back to Search</span>
          </button>
          <h2 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-md">Top Candidate Matches</h2>
          <p className="text-slate-400 mt-2 font-medium">AI-driven ranking based on extracted requirements.</p>
        </div>
        
        <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-xl text-sm font-medium text-slate-300">
          <LayoutGrid className="w-4 h-4 text-primary-500" />
          Showing {candidates.length} profiles
        </div>
      </div>

      {/* Extracted JD Skills Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-6 md:p-8 rounded-3xl mb-12 shadow-xl border-t border-t-white/10 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-900/50 to-teal-900/50 border border-primary-500/30">
            <CheckCircle2 className="w-8 h-8 text-primary-400 drop-shadow-md" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white tracking-tight mb-3">Extracted Core Requirements</h3>
            <div className="flex flex-wrap gap-2.5">
              {jdSkills.map((skill, i) => (
                <span key={i} className="px-4 py-1.5 bg-dark-700/80 text-emerald-300 text-sm font-semibold rounded-lg border border-dark-500 shadow-inner tracking-wide uppercase shadow-dark-900/50 backdrop-blur-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Candidates List Component Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            index={index}
            jd={jd}
          />
        ))}
      </div>
    </div>
  );
}
