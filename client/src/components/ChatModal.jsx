import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Inbox,
  Send,
  Download,
  X,
  Building2,
  UserRound,
  MessageSquareText,
} from 'lucide-react';
import {
  ensureThread,
  loadInterviewThreads,
  processThreadReply,
  processRecruiterReply,
  downloadInterviewReport,
  formatInterviewDate,
  formatInterviewWeekday,
  getThreadPreview,
} from '../utils/interviewInbox';
import { getCandidateAvatar as getStoredCandidateAvatar } from '../utils/candidateDisplayId';

const recruiterAvatar = 'https://i.pravatar.cc/100?img=5';

function getCandidateAvatar(thread = {}, candidate = {}, browserCandidate = {}) {
  return (
    browserCandidate?.avatar ||
    thread.candidateAvatar ||
    candidate?.avatar ||
    getStoredCandidateAvatar(browserCandidate || candidate || thread) ||
    `https://i.pravatar.cc/100?u=${thread.candidateEmail || thread.candidateName || candidate?.email || candidate?.name || browserCandidate?.email || browserCandidate?.name || 'candidate'}`
  );
}

export default function ChatModal({
  isOpen,
  candidate,
  jd,
  recruiterProfile,
  candidateProfile,
  viewerRole = 'recruiter',
  onThreadsChange,
  onClose,
}) {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [recruiterDraft, setRecruiterDraft] = useState('');
  const [sending, setSending] = useState(false);

  const browserCandidate = candidateProfile || candidate || null;

  useEffect(() => {
    if (!isOpen) return;

    const refresh = () => {
      const storedThreads = loadInterviewThreads();
      let nextThreads = storedThreads;

      if (candidate && viewerRole === 'recruiter') {
        const ensured = ensureThread(candidate, recruiterProfile || {}, jd || '');
        nextThreads = loadInterviewThreads();
        setSelectedThreadId(ensured.id);
      } else {
        if (viewerRole === 'candidate' && browserCandidate?.email) {
          nextThreads = storedThreads.filter((thread) => thread.candidateEmail === browserCandidate.email);
        } else if (viewerRole === 'candidate' && browserCandidate?.name) {
          nextThreads = storedThreads.filter((thread) => thread.candidateName === browserCandidate.name);
        }

        if (!selectedThreadId && nextThreads.length > 0) {
          setSelectedThreadId(nextThreads[0].id);
        }
      }

      setThreads(nextThreads);
    };

    refresh();
    if (typeof onThreadsChange === 'function') {
      onThreadsChange(loadInterviewThreads());
    }

    const handleStorage = () => refresh();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isOpen, candidate, jd, recruiterProfile, viewerRole, browserCandidate?.email, browserCandidate?.name, selectedThreadId, onThreadsChange]);

  const visibleThreads = useMemo(() => {
    if (viewerRole === 'candidate') {
      if (!browserCandidate) {
        return [];
      }

      return threads.filter((thread) =>
        browserCandidate.email
          ? thread.candidateEmail === browserCandidate.email
          : thread.candidateName === browserCandidate.name
      );
    }
    return threads;
  }, [browserCandidate, threads, viewerRole]);

  const selectedThread = useMemo(() => {
    if (visibleThreads.length === 0) return null;
    return visibleThreads.find((thread) => thread.id === selectedThreadId) || visibleThreads[0];
  }, [selectedThreadId, visibleThreads]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !selectedThread || sending) return;

    setSending(true);
    const updated = processThreadReply(selectedThread, draft);
    const nextThreads = loadInterviewThreads();
    setThreads(viewerRole === 'candidate' && browserCandidate
      ? nextThreads.filter((thread) =>
          browserCandidate.email ? thread.candidateEmail === browserCandidate.email : thread.candidateName === browserCandidate.name
        )
      : nextThreads);
    setSelectedThreadId(updated.id);
    setDraft('');
    setSending(false);
    if (typeof onThreadsChange === 'function') {
      onThreadsChange(loadInterviewThreads());
    }
  };

  const handleRecruiterSend = (e) => {
    e.preventDefault();
    if (!recruiterDraft.trim() || !selectedThread || sending) return;

    setSending(true);
    const updated = processRecruiterReply(selectedThread, recruiterDraft);
    const nextThreads = loadInterviewThreads();
    setThreads(viewerRole === 'candidate' && browserCandidate
      ? nextThreads.filter((thread) =>
          browserCandidate.email ? thread.candidateEmail === browserCandidate.email : thread.candidateName === browserCandidate.name
        )
      : nextThreads);
    setSelectedThreadId(updated.id);
    setRecruiterDraft('');
    setSending(false);
    if (typeof onThreadsChange === 'function') {
      onThreadsChange(loadInterviewThreads());
    }
  };

  const openReport = () => {
    if (!selectedThread) return;
    downloadInterviewReport(selectedThread);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[min(1400px,calc(100vw-1.5rem))] bg-white border border-slate-200 rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-semibold">
              {viewerRole === 'candidate' ? 'Inbox' : 'Chat'}
            </p>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
              {viewerRole === 'candidate' ? 'Candidate Inbox' : 'Recruiter Chat'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {selectedThread?.stage === 'scheduled' && (
              <button
                onClick={openReport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Chat PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] h-[86vh] max-h-[860px]">
          <aside className="min-w-0 border-r border-slate-100 bg-slate-50/70 overflow-y-auto">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Inbox className="w-4 h-4 text-primary-600" />
                Conversations
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {viewerRole === 'candidate'
                  ? 'Messages from recruiters and interview updates'
                  : 'Candidate replies and interview status'}
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleThreads.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No inbox items yet.
                </div>
              ) : (
                visibleThreads.map((thread) => {
                  const active = thread.id === selectedThread?.id;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left px-4 py-4 transition-colors ${
                        active ? 'bg-white' : 'hover:bg-white/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                      <img
                        src={viewerRole === 'candidate' ? recruiterAvatar : getCandidateAvatar(thread, candidate, browserCandidate)}
                        alt={viewerRole === 'candidate' ? thread.recruiterName : thread.candidateName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {viewerRole === 'candidate' ? thread.recruiterName : thread.candidateName}
                            </p>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-1 rounded-full ${
                              thread.stage === 'scheduled'
                                ? 'bg-red-100 text-red-700'
                                : thread.stage === 'awaiting_mode'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {thread.stage === 'scheduled' ? 'Scheduled' : thread.stage.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {getThreadPreview(thread)}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {thread.interviewDate ? formatInterviewDate(thread.interviewDate) : 'No date yet'}
                            </span>
                            <span>{thread.interviewMode || 'mode pending'}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex flex-col bg-white min-w-0 min-h-0 overflow-hidden">
            {selectedThread ? (
              <>
                <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={viewerRole === 'candidate' ? recruiterAvatar : getCandidateAvatar(selectedThread, candidate, browserCandidate)}
                      alt={viewerRole === 'candidate' ? selectedThread.recruiterName : selectedThread.candidateName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 truncate">
                          {viewerRole === 'candidate' ? selectedThread.recruiterName : selectedThread.candidateName}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <MessageSquareText className="w-3.5 h-3.5 text-primary-500" />
                          AI interview flow
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {selectedThread.candidateRole || 'Candidate profile'} {selectedThread.jd ? `- ${selectedThread.jd}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">Interview</p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedThread.interviewDate ? formatInterviewDate(selectedThread.interviewDate) : 'Awaiting date'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedThread.interviewDate ? formatInterviewWeekday(selectedThread.interviewDate) : 'Waiting for candidate reply'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/60 p-4 md:p-6 space-y-4 min-h-0">
                  {selectedThread.messages.map((message) => {
                    const isRecruiter = message.role === 'recruiter';
                    const alignRight = !isRecruiter;
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-3 min-w-0 ${alignRight ? 'justify-end' : 'justify-start'}`}
                      >
                        {!alignRight && (
                          <img
                            src={recruiterAvatar}
                            alt="Recruiter"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[calc(100%-3rem)] md:max-w-[68%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                            alignRight
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          {message.text}
                        </div>
                        {alignRight && (
                          <img
                            src={viewerRole === 'candidate' ? `https://i.pravatar.cc/100?u=${browserCandidate?.email || browserCandidate?.name || 'candidate'}` : getCandidateAvatar(selectedThread, candidate, browserCandidate)}
                            alt="Candidate"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {viewerRole === 'candidate' ? (
                  <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={
                          selectedThread.stage === 'opening'
                            ? 'Reply yes or no'
                            : selectedThread.stage === 'awaiting_time'
                              ? 'Share the time you are free'
                              : selectedThread.stage === 'awaiting_date'
                                ? 'Share your preferred date'
                              : 'Reply online or offline'
                        }
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {selectedThread.stage === 'scheduled'
                        ? 'Interview details are saved and appear on the recruiter calendar.'
                        : 'Your reply will update the recruiter inbox and the schedule automatically.'}
                    </p>
                  </form>
                ) : (
                  <div className="border-t border-slate-100 bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-primary-600" />
                      <span>{selectedThread.status === 'scheduled' ? 'Interview confirmed' : 'Waiting for candidate reply'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <form onSubmit={handleRecruiterSend} className="flex items-center gap-2 min-w-0">
                        <input
                          value={recruiterDraft}
                          onChange={(e) => setRecruiterDraft(e.target.value)}
                          placeholder="Type recruiter reply"
                          className="w-full md:w-72 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                        />
                        <button
                          type="submit"
                          disabled={sending}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                          <Send className="w-4 h-4" />
                          Reply
                        </button>
                      </form>
                      {selectedThread.stage === 'scheduled' && (
                        <button
                          onClick={openReport}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Chat PDF
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <UserRound className="w-4 h-4" />
                        Close Report
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
                <div>
                  <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-700">No conversation selected</p>
                  <p className="text-sm mt-1">Open a candidate thread to continue the interview flow.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
