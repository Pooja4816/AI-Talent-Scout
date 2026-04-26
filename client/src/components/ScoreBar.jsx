import { motion } from 'framer-motion';

export default function ScoreBar({ label, percentage, color }) {
  return (
    <div className="w-full relative group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold text-slate-300 tracking-wide drop-shadow-sm">{label}</span>
        <span className="text-sm font-bold text-white tracking-widest">{percentage}%</span>
      </div>
      
      {/* Background Track */}
      <div className="w-full h-3 bg-dark-900/60 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
        {/* Animated fill indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={`absolute top-0 left-0 bottom-0 ${color} rounded-full flex overflow-hidden`}
        >
          {/* Subtle moving shine effect on the progress bar */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_2s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
}
