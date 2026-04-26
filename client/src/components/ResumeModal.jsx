import { motion } from 'framer-motion';
import { X, MapPin, Briefcase, Wrench, FileText } from 'lucide-react';
import { getCandidateAvatar, getCandidateDisplayId, getCandidateSummary } from '../utils/candidateDisplayId';

export default function ResumeModal({ candidate, recruiterProfile, onClose }) {
  const displayId = getCandidateDisplayId(candidate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Candidate Resume</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start gap-4">
            <img
              src={getCandidateAvatar(candidate)}
              alt={candidate.name}
              className="w-16 h-16 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <h4 className="text-2xl font-bold text-slate-800 leading-tight">{candidate.name}</h4>
              <p className="text-base text-slate-600 font-medium mt-1">{candidate.role}</p>
              <p className="text-sm text-slate-500 mt-1">ID: {displayId}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> Remote
              </p>
            </div>
          </div>

          <section>
            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary-600" /> Professional Summary
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              {getCandidateSummary(candidate)}
            </p>
          </section>

          <section>
            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary-600" /> Skills
            </h5>
            <div className="flex flex-wrap gap-2.5">
              {candidate.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-md border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" /> Experience
            </h5>
            <p className="text-sm text-slate-600">{candidate.experience}</p>
          </section>

          {recruiterProfile && (
            <section>
              <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" /> Recruiter
              </h5>
              <div className="flex items-center gap-3">
                <img
                  src={recruiterProfile.avatar_url}
                  alt={recruiterProfile.name}
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{recruiterProfile.name}</p>
                  <p className="text-xs text-slate-500">Employee ID: {recruiterProfile.employee_id}</p>
                  <p className="text-xs font-bold uppercase text-slate-900">{recruiterProfile.company_name}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  );
}
