import { motion } from 'framer-motion';
import JobInput from '../components/JobInput';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-10 animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[100px] -z-10 animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[150px] -z-10 animate-blob animation-delay-4000 mix-blend-screen pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // smooth apple-like ease out
        className="w-full max-w-4xl mx-auto text-center z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wide text-primary-300 uppercase">AI-Powered Talent Matching Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.1]">
          Find the perfect match with{' '}
          <span className="text-gradient drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
            AI Precision.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Agentalent uses advanced neural networks to analyze your job description, isolate required skills, and instantly match you with top-tier candidates.
        </p>

        <JobInput />
      </motion.div>
    </div>
  );
}
