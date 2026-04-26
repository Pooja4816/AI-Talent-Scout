import { useState } from 'react';
import { Bookmark, FileText, Download, MapPin, CheckCircle2 } from 'lucide-react';
import ChatModal from './ChatModal';
import ResumeModal from './ResumeModal.jsx';
import { getCandidateAvatar, getCandidateDisplayId } from '../utils/candidateDisplayId';

export default function CandidateCard({ candidate, jd, recruiterProfile, onThreadUpdate }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const displayId = getCandidateDisplayId(candidate);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[300px] shadow-card hover:shadow-float hover:border-primary-200 transition-all duration-300 flex flex-col h-full group relative">
        
        {/* Bookmark Icon */}
        <button 
          onClick={() => setBookmarked(!bookmarked)}
          className={`absolute top-5 right-5 transition-colors ${bookmarked ? 'text-primary-600' : 'text-slate-300 hover:text-slate-400'}`}
        >
          <Bookmark className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} />
        </button>

        {/* Header (Profile Pic & Info) */}
        <div className="flex items-start gap-3 mb-3">
          <img 
            src={getCandidateAvatar(candidate)} 
            alt={candidate.name} 
            className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover"
          />
          <div>
            <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 leading-tight">
              {candidate.name}
              <CheckCircle2 className="w-4 h-4 text-primary-500" fill="white" />
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-normal">{candidate.role}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              ID: {displayId}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> Remote
            </p>

          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 mb-3 items-end">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Match</span>
            <span className="text-lg font-bold text-slate-800 leading-none">{candidate.matchScore}%</span>
            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-success-500 rounded-full" style={{ width: `${candidate.matchScore}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Interest</span>
            <span className="text-lg font-bold text-slate-800 leading-none">{candidate.interestScore}%</span>
            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${candidate.interestScore}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-primary-500 tracking-wider mb-0.5">Final</span>
            <span className="text-lg font-bold text-primary-600 leading-none">{candidate.finalScore}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button 
            onClick={() => setChatOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 group border border-transparent shadow-md shadow-primary-500/20"
          >
            <FileText className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Chat</span>
          </button>
          <button
            onClick={() => setResumeOpen(true)}
            className="btn-outline flex items-center justify-center gap-2 group"
          >
            <Download className="w-4 h-4 text-slate-400 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-sm">Resume</span>
          </button>
        </div>

      </div>

      {chatOpen && (
        <ChatModal
          isOpen={chatOpen}
          candidate={candidate}
          jd={jd}
          recruiterProfile={recruiterProfile}
          viewerRole="recruiter"
          onThreadsChange={onThreadUpdate}
          onClose={() => setChatOpen(false)}
        />
      )}

      {resumeOpen && (
        <ResumeModal candidate={candidate} recruiterProfile={recruiterProfile} onClose={() => setResumeOpen(false)} />
      )}
    </>
  );
}
