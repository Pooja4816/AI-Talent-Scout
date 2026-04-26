import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  Edit2,
  Check,
  X,
  Briefcase,
  Wrench,
  CalendarDays,
  Inbox,
  FileText,
  LayoutGrid,
  Download,
  LogOut,
} from 'lucide-react';
import CandidateCard from '../components/CandidateCard';
import CandidateProfileForm from '../components/CandidateProfileForm';
import ChatModal from '../components/ChatModal';
import mockCandidates from '../data/mockCandidates';
import { supabase } from '../services/supabaseClient';
import {
  downloadChatSummary,
  downloadInterviewReport,
  formatInterviewDate,
  formatInterviewTime,
  getScheduledEvents,
  loadInterviewThreads,
  loadInterviewSeenState,
  markCandidateInboxSeen,
  markRecruiterReportSeen,
  getUnreadCandidateThreadCount,
} from '../utils/interviewInbox';
import { getCandidateAvatar, getCandidateSummary } from '../utils/candidateDisplayId';
import RecruiterProfileForm from '../components/RecruiterProfileForm';

// Metric Card Component
function MetricCard({ icon: Icon, title, value, trend, trendUp, iconBg, iconColor }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</h3>
        {trend && (
          <p className={`text-xs font-semibold ${trendUp ? 'text-success-600' : 'text-slate-400'}`}>
            {trendUp && '↑ '} {trend}
          </p>
        )}
      </div>
    </div>
  );
}

const CandidatesIcon = (props) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MatchIcon = (props) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = (props) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CartIcon = (props) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const HeartIcon = (props) => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;

function isSameCalendarDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function buildCalendarMatrix(monthDate, events = []) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const eventMap = new Map();
  events.forEach((event) => {
    const key = new Date(event.date).toDateString();
    if (!eventMap.has(key)) {
      eventMap.set(key, []);
    }
    eventMap.get(key).push(event);
  });

  return { weeks, eventMap };
}

function InterviewCalendar({ title, monthDate, onPrev, onNext, events = [] }) {
  const { weeks, eventMap } = buildCalendarMatrix(monthDate, events);
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthDate);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">{title}</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNext} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-7 gap-2 mb-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-400 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeks.flat().map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square rounded-lg bg-slate-50/60 border border-dashed border-slate-100" />;
            }

            const dayEvents = eventMap.get(day.toDateString()) || [];
            const hasEvent = dayEvents.length > 0;
            const currentDate = new Date();
            const isToday = isSameCalendarDay(day, currentDate);
            const isSelectedMonth = day.getMonth() === monthDate.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-lg border p-2 flex flex-col justify-between transition-colors ${
                  hasEvent
                    ? 'bg-red-50 border-red-200'
                    : isToday
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-slate-200'
                } ${isSelectedMonth ? '' : 'opacity-60'}`}
              >
                <span className={`text-sm font-semibold ${hasEvent ? 'text-red-700' : 'text-slate-700'}`}>
                  {day.getDate()}
                </span>
                <div className="flex items-center justify-between gap-1">
                  {hasEvent ? (
                    <div className="flex flex-col gap-1 w-full">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                        <CalendarDays className="w-3 h-3" />
                        Interview
                      </span>
                      <span className="text-[11px] text-red-700 font-medium truncate">
                        {dayEvents[0].candidateName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {events.length > 0 && (
          <div className="mt-4 space-y-2">
            {events.slice(0, 3).map((event) => (
              <div key={`${event.id}-summary`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{event.candidateName}</p>
                  <p className="text-xs text-slate-500 truncate">{event.mode || 'online/offline'} interview</p>
                </div>
                <span className="text-xs font-semibold text-red-700 whitespace-nowrap">
                  {formatInterviewDate(event.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [jd, setJd] = useState('');
  const [inboxOpen, setInboxOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [recruiterSection, setRecruiterSection] = useState('matchmaking');
  const [candidateSection, setCandidateSection] = useState('profile');
  const [interviewThreads, setInterviewThreads] = useState([]);
  const [seenState, setSeenState] = useState(() => loadInterviewSeenState());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [draftJd, setDraftJd] = useState(jd);
  const [jdError, setJdError] = useState('');
  const [invalidRequirement, setInvalidRequirement] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Failed to sign out from Supabase', error);
    }

    navigate('/login', { replace: true });
  };

  const normalizeText = (text) => text.toLowerCase().replace(/[./]+/g, ' ').trim();

  const technicalSynonyms = {
    ai: 'machine learning',
    ml: 'machine learning',
    'machine learning': 'machine learning',
    'data science': 'data scientist',
    'data scientist': 'data scientist',
    'web developer': 'web developer',
    'frontend developer': 'web developer',
    'frontend engineer': 'web developer',
    'ui developer': 'web developer',
    'react developer': 'web developer',
    'full stack developer': 'web developer',
    'fullstack developer': 'web developer',
    'backend developer': 'backend developer',
    'software developer': 'software developer',
    'software engineer': 'software engineer',
    'devops engineer': 'devops engineer',
    'devops': 'devops engineer',
    'frontend': 'web developer',
    'full stack engineer': 'web developer',
    'backend engineer': 'backend developer',
    pandas: 'pandas',
    python: 'python',
    sql: 'sql',
    'machine learning engineer': 'data scientist',
    tensorflow: 'tensorflow',
    pytorch: 'pytorch',
    docker: 'docker',
    kubernetes: 'kubernetes',
    aws: 'aws',
    azure: 'azure',
    gcp: 'cloud',
    'node.js': 'node.js',
    node: 'node.js',
    javascript: 'javascript',
    react: 'react',
    redux: 'react',
    'next.js': 'next.js',
    typescript: 'typescript',
    html: 'html',
    css: 'css',
    django: 'django',
    flask: 'flask',
    java: 'java',
    sqlserver: 'sql',
    postgres: 'sql',
    postgresql: 'sql',
  };

  const roleSkillSignals = {
    'web developer': ['html', 'css', 'javascript', 'typescript', 'react', 'next.js', 'node.js', 'frontend', 'tailwind css', 'tailwind'],
    'backend developer': ['node.js', 'express', 'api', 'sql', 'postgres', 'mongodb', 'docker', 'python', 'java'],
    'software engineer': ['javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'sql', 'docker'],
    'data scientist': ['python', 'pandas', 'sql', 'machine learning', 'tensorflow', 'pytorch', 'numpy', 'scikit-learn', 'r'],
    'devops engineer': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'monitoring', 'ansible', 'ci/cd'],
  };

  const extractTerms = (text) => {
    const normalized = normalizeText(text);
    const rawTokens = normalized.match(/[a-z0-9+#]+/g) || [];
    const terms = new Set();

    rawTokens.forEach((token) => {
      const canonical = technicalSynonyms[token] || token;
      terms.add(canonical);
    });

    Object.keys(technicalSynonyms).forEach((phrase) => {
      if (phrase.includes(' ') && normalized.includes(phrase)) {
        terms.add(technicalSynonyms[phrase]);
      }
    });

    return terms;
  };

  const buildCandidateTerms = (candidate) => {
    const terms = new Set();
    const role = normalizeText(candidate.role || '');
    const roleCanonical = technicalSynonyms[role] || role;
    terms.add(roleCanonical);

    // Handle both array and string skills format
    const skillsArray = Array.isArray(candidate.skills)
      ? candidate.skills
      : typeof candidate.skills === 'string'
      ? candidate.skills.split(',').map(s => s.trim())
      : [];

    skillsArray.forEach((skill) => {
      const normalizedSkill = normalizeText(skill);
      const canonical = technicalSynonyms[normalizedSkill] || normalizedSkill;
      terms.add(canonical);
    });

    const experienceText = normalizeText(candidate.experience || '');
    Object.keys(roleSkillSignals).forEach((role) => {
      const signals = roleSkillSignals[role] || [];
      if (role === roleCanonical || signals.some((signal) => experienceText.includes(normalizeText(signal)))) {
        terms.add(role);
      }
    });

    return terms;
  };

  const getStableCandidateSeed = (candidate = {}) => {
    const source = String(candidate.email || candidate.name || candidate.id || 'candidate').toLowerCase();
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) {
      hash = (hash * 31 + source.charCodeAt(i)) % 1000;
    }
    return hash;
  };

  const scoreCandidate = (candidate, normalizedJd) => {
    if (!normalizeText(normalizedJd || '')) {
      return {
        ...candidate,
        matchScore: 50,
        interestScore: 50,
        finalScore: 50,
        roleMatch: false,
        matchedSkills: 0,
        candidateTerms: [],
        jdTerms: [],
      };
    }

    const jdTerms = extractTerms(normalizedJd);
    const searchTokens = (normalizeText(normalizedJd).match(/[a-z0-9+#]+/g) || []).map((token) => technicalSynonyms[token] || token);
    const candidateTerms = buildCandidateTerms(candidate);
    const roleText = normalizeText(candidate.role);
    const canonicalRole = technicalSynonyms[roleText] || roleText;
    const jdRoleAliases = [
      canonicalRole,
      technicalSynonyms[canonicalRole] || canonicalRole,
      ...Object.entries(technicalSynonyms)
        .filter(([alias, canonical]) => canonical === canonicalRole && alias !== canonicalRole)
        .map(([alias]) => alias),
    ];
    const roleDirectMatch = jdRoleAliases.some((alias) => normalizedJd.includes(alias));
    const fuzzyRoleMatch = searchTokens.some((token) => {
      if (!token) return false;
      return [roleText, canonicalRole, ...jdRoleAliases, ...candidateTerms].some((term) => {
        const normalizedTerm = normalizeText(term);
        return normalizedTerm.includes(token) || token.includes(normalizedTerm);
      });
    });
    const roleSignalMatches = (roleSkillSignals[canonicalRole] || []).filter((signal) => {
      const normalizedSignal = normalizeText(signal);
      return candidateTerms.has(normalizedSignal) || candidateTerms.has(technicalSynonyms[normalizedSignal] || normalizedSignal);
    }).length;
    const roleMatch =
      normalizedJd.includes(roleText) ||
      roleDirectMatch ||
      fuzzyRoleMatch ||
      jdTerms.has(canonicalRole) ||
      (roleSignalMatches >= 2 && ['web developer', 'backend developer', 'software engineer', 'data scientist'].includes(canonicalRole));

    const matchedSkills = [...candidateTerms].filter((term) => term !== roleText && jdTerms.has(term)).length;
    let matchScore;
    if (roleMatch) {
      matchScore = 100;
    } else if (matchedSkills > 0) {
      matchScore = 99;
    } else {
      const seed = getStableCandidateSeed(candidate);
      matchScore = Math.min(95, Math.max(55, 60 + matchedSkills * 6 + (seed % 5) * 2));
    }

    const seed = getStableCandidateSeed(candidate);
    const interestScore = Math.min(95, Math.max(60, 70 + matchedSkills * 4 + (seed % 4) * 3));
    const finalScore = roleMatch || roleSignalMatches >= 2 ? 100 : matchedSkills > 0 ? 99 : Math.round(matchScore * 0.6 + interestScore * 0.4);
    return { ...candidate, matchScore, interestScore, finalScore, roleMatch, matchedSkills, candidateTerms: [...candidateTerms], jdTerms: [...jdTerms] };
  };
  const [results, setResults] = useState({
    jdSkills: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'TensorFlow'],
    candidates: mockCandidates.map((candidate) => scoreCandidate(candidate, jd.toLowerCase()))
  });
  const [loading, setLoading] = useState(false);
  const [recruitmentProfileOpen, setRecruitmentProfileOpen] = useState(false);
  const [candidateProfileFormOpen, setCandidateProfileFormOpen] = useState(false);
  const [recruiterProfileFormOpen, setRecruiterProfileFormOpen] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const location = useLocation();
  const isRecruiterView = location.pathname === '/recruiter-dashboard';
  const isCandidateView = location.pathname === '/candidate-dashboard';

  const normalizeRecruiterProfile = (profile = {}, fallbackEmail = '') => {
    const email = profile.email || fallbackEmail || '';
    return {
      ...profile,
      email,
      avatar_url: profile.avatar_url || `https://i.pravatar.cc/100?u=${email || profile.employee_id || profile.name || 'recruiter'}`,
      company_name: profile.company_name || profile.company || 'Not specified',
      role: profile.role || 'Recruiter',
      name: profile.name || 'Recruiter',
    };
  };

  const getActiveLoginEmail = () => {
    if (typeof window === 'undefined') return '';
    return (
      (isRecruiterView
        ? window.localStorage.getItem('activeRecruiterEmail')
        : window.localStorage.getItem('activeCandidateEmail')) ||
      window.localStorage.getItem('activeUserEmail') ||
      ''
    );
  };

  const loadRecruiterProfileFromStorage = (email = '') => {
    if (typeof window === 'undefined') return null;
    const keys = email
      ? [`recruiterProfile:${email}`, `recruiterRegistration:${email}`, 'recruiterProfile', 'recruiterRegistration']
      : ['recruiterProfile', 'recruiterRegistration'];

    for (const key of keys) {
      const storedProfile = window.localStorage.getItem(key);
      if (!storedProfile) continue;

      try {
        return JSON.parse(storedProfile);
      } catch (error) {
        console.warn(`Failed to parse ${key} from storage`, error);
      }
    }

    return null;
  };

  useEffect(() => {
    const refreshThreads = () => setInterviewThreads(loadInterviewThreads());
    const refreshSeen = () => setSeenState(loadInterviewSeenState());
    const refreshCandidates = () => {
      if (!isRecruiterView) return;
      const allCandidates = loadCandidatesForRecruiter();
      const scoredCandidates = allCandidates.map((candidate) => scoreCandidate(candidate, jd.toLowerCase()));
      setResults({
        jdSkills: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'TensorFlow'],
        candidates: scoredCandidates
      });
    };
    queueMicrotask(() => {
      refreshThreads();
      refreshSeen();
      refreshCandidates();
    });

    if (typeof window === 'undefined') return undefined;

    window.addEventListener('storage', refreshThreads);
    window.addEventListener('storage', refreshSeen);
    window.addEventListener('storage', refreshCandidates);
    return () => {
      window.removeEventListener('storage', refreshThreads);
      window.removeEventListener('storage', refreshSeen);
      window.removeEventListener('storage', refreshCandidates);
    };
  }, [isRecruiterView, isCandidateView, candidateProfile, recruiterProfile, jd]);

  useEffect(() => {
    if (!isRecruiterView) return;
    const loadRecruiterProfile = async () => {
      const activeEmail = getActiveLoginEmail();
      const storedProfile = loadRecruiterProfileFromStorage(activeEmail);
      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      const email = user?.email || activeEmail || storedProfile?.email || '';

      let recruiterRow = null;
      if (user?.id) {
        const { data: recruiterData, error } = await supabase
          .from('recruiters')
          .select('name, email, company_name, employee_id, location, role, phone, md_name, user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error) {
          recruiterRow = recruiterData || null;
        } else {
          console.warn('Failed to fetch recruiter row from Supabase', error);
        }
      }

      const mergedProfile = normalizeRecruiterProfile(
        {
          ...storedProfile,
          ...recruiterRow,
        },
        email
      );

      if (mergedProfile.email || mergedProfile.name !== 'Recruiter') {
        setRecruiterProfile(mergedProfile);
      } else if (storedProfile) {
        setRecruiterProfile(normalizeRecruiterProfile(storedProfile, email));
      }
    };

    loadRecruiterProfile();
  }, [isRecruiterView]);

  useEffect(() => {
    if (!isCandidateView) return;
    queueMicrotask(() => {
      const activeEmail = getActiveLoginEmail();
      const keys = activeEmail
        ? [
            `candidateProfile:${activeEmail}`,
            'candidateProfile',
            `candidateRegistration:${activeEmail}`,
            'candidateRegistration',
            `candidateProfileSeed:${activeEmail}`,
            'candidateProfileSeed',
          ]
        : ['candidateProfile', 'candidateRegistration', 'candidateProfileSeed'];

      const storedProfile = keys.reduce((found, key) => found || window.localStorage.getItem(key), '');
      if (storedProfile) {
        try {
          setCandidateProfile(JSON.parse(storedProfile));
          console.log('Loaded candidate profile:', JSON.parse(storedProfile));
        } catch (error) {
          console.warn('Failed to parse candidate profile from storage', error);
        }
      }
    });
  }, [isCandidateView]);

  // Load all candidate profiles for recruiter view
  function loadCandidatesForRecruiter() {
    let allCandidates = [...mockCandidates];
    try {
      const storedCandidates = window.localStorage.getItem('allCandidates');
      if (storedCandidates) {
        const candidatesObj = JSON.parse(storedCandidates);
        Object.values(candidatesObj).forEach((candidate) => {
          // Only add if not already in mock candidates
          if (!mockCandidates.some(c => c.email === candidate.email)) {
            allCandidates.push(candidate);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load candidates from storage', error);
    }
    return allCandidates;
  }

  useEffect(() => {
    if (!isRecruiterView) return;
    // Reload candidates when entering recruiter view
    queueMicrotask(() => {
      const allCandidates = loadCandidatesForRecruiter();
      const scoredCandidates = allCandidates.map((candidate) => scoreCandidate(candidate, jd.toLowerCase()));
      setResults({
        jdSkills: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'TensorFlow'],
        candidates: scoredCandidates
      });
    });
  }, [isRecruiterView, jd]);

  const handleCandidateProfileSave = (profile) => {
    setCandidateProfile(profile);
    if (isRecruiterView) {
      const allCandidates = loadCandidatesForRecruiter();
      const scoredCandidates = allCandidates.map((candidate) => scoreCandidate(candidate, jd.toLowerCase()));
      setResults({
        jdSkills: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'TensorFlow'],
        candidates: scoredCandidates
      });
    }
  };

  const handleRecruiterProfileSave = (profile) => {
    setRecruiterProfile(profile);
  };

  const validRequirementKeywords = [
    'data scientist',
    'frontend engineer',
    'full stack developer',
    'backend developer',
    'machine learning engineer',
    'data analyst',
    'react',
    'python',
    'sql',
    'node.js',
    'javascript',
    'java',
    'tensorflow',
    'pandas',
    'django',
    'angular',
    'aws',
    'devops'
  ];

  const isValidRequirementName = (value) => {
    const input = (value || '').trim();
    if (input.length < 3) return false;

    const words = input.match(/[A-Za-z]{2,}/g) || [];
    if (words.length < 2) return false;

    const nonSpaceChars = input.replace(/\s/g, '');
    const alphaChars = (input.match(/[A-Za-z]/g) || []).length;
    if (!nonSpaceChars.length) return false;

    const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ');
    const hasValidKeyword = validRequirementKeywords.some(keyword => normalizedInput.includes(keyword));
    if (!hasValidKeyword) return false;

    return alphaChars / nonSpaceChars.length >= 0.6;
  };

  const fetchMatches = async (jobDescription) => {
    setLoading(true);
    setJdError('');
    const normalizedJd = normalizeText(jobDescription || '');
    const filtered = mockCandidates.map((candidate) => scoreCandidate(candidate, normalizedJd));

    setResults({ jdSkills: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'TensorFlow'], candidates: filtered });
    setInvalidRequirement(false);
    setLoading(false);
  };

  const handleJdSubmit = () => {
    if (!isValidRequirementName(draftJd)) {
      setJdError('Write a valid requirement');
      setDraftJd('');
      setIsEditingJd(false);
      setResults({ jdSkills: [], candidates: [] });
      setInvalidRequirement(true);
      return;
    }

    setJd(draftJd);
    setJdError('');
    setInvalidRequirement(false);
    setIsEditingJd(false);
    fetchMatches(draftJd);
  };

  // Filtering Logic
  const filteredCandidates = useMemo(() => {
    const filtered = [...(results.candidates || [])];
    filtered.sort((a, b) => Number(b.roleMatch) - Number(a.roleMatch) || b.finalScore - a.finalScore || b.matchScore - a.matchScore);
    return filtered;
  }, [results.candidates]);

  // Aggregate Metrics based on Filtered Results
  const totalCards = filteredCandidates.length;
  const highMatch = filteredCandidates.filter(c => c.matchScore >= 80).length;
  const highInterest = filteredCandidates.filter(c => c.interestScore >= 80).length;
  const shortlisted = Math.floor(highMatch * 0.4); // Mock shortlisting logic for demo
  const avgMatch = totalCards > 0 ? Math.round(filteredCandidates.reduce((acc, c) => acc + c.matchScore, 0) / totalCards) : 0;
  const hasRoleSearch = jd.trim().length > 0;
  const roleMatchedCandidates = useMemo(
    () => (hasRoleSearch ? filteredCandidates.filter((candidate) => candidate.roleMatch) : []),
    [filteredCandidates, hasRoleSearch]
  );
  const suggestedCandidates = useMemo(
    () => (hasRoleSearch ? filteredCandidates.filter((candidate) => !candidate.roleMatch) : filteredCandidates),
    [filteredCandidates, hasRoleSearch]
  );
  const recruiterCalendarEvents = useMemo(() => getScheduledEvents(interviewThreads), [interviewThreads]);
  const candidateCalendarEvents = useMemo(() => getScheduledEvents(interviewThreads, candidateProfile?.email || ''), [interviewThreads, candidateProfile?.email]);
  const activeCalendarEvents = isCandidateView ? candidateCalendarEvents : recruiterCalendarEvents;
  const calendarTitle = isCandidateView ? 'My Interview Calendar' : 'Interview Calendar';
  const scheduledReports = useMemo(
    () => interviewThreads.filter((thread) => thread.stage === 'scheduled' && thread.interviewDate),
    [interviewThreads]
  );
  const candidateInboxUnreadCount = useMemo(
    () => (
      isCandidateView
        ? getUnreadCandidateThreadCount(
          interviewThreads,
          candidateProfile?.email || '',
          candidateProfile?.name || '',
          seenState.candidateInboxSeenAt || ''
        )
        : 0
    ),
    [isCandidateView, interviewThreads, candidateProfile?.email, candidateProfile?.name, seenState.candidateInboxSeenAt]
  );
  const handleOpenCandidateInbox = () => {
    setSeenState(markCandidateInboxSeen());
    setInboxOpen(true);
  };

  const handleOpenRecruiterReport = () => {
    setSeenState(markRecruiterReportSeen());
    setRecruiterSection('report');
    setReportMenuOpen(false);
  };

  const refreshRecruiterProfile = async () => {
    const storedProfile = loadRecruiterProfileFromStorage();
    const { data } = await supabase.auth.getUser();
    const user = data?.user || null;
    const email = user?.email || storedProfile?.email || '';

    let recruiterRow = null;
    if (user?.id) {
      const { data: recruiterData, error } = await supabase
        .from('recruiters')
        .select('name, email, company_name, employee_id, location, role, phone, md_name, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        recruiterRow = recruiterData || null;
      } else {
        console.warn('Failed to fetch recruiter row during refresh', error);
      }
    }

    const mergedProfile = normalizeRecruiterProfile(
      {
        ...storedProfile,
        ...recruiterRow,
      },
      email
    );

    setRecruiterProfile(mergedProfile);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-surface pb-10">
      
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {isRecruiterView ? 'Candidate Matches' : 'My Dashboard'}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {isRecruiterView ? 'AI-Powered talent discovery & engagement' : 'Update your profile and discover opportunities'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isRecruiterView ? (
            <div className="relative">
              <button
                className="btn-outline flex items-center gap-2 relative"
                onClick={() => setReportMenuOpen((open) => !open)}
              >
                <FileText className="w-4 h-4" />
                Report
                {reportMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {reportMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-40">
                  <button
                    onClick={handleOpenRecruiterReport}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <p className="font-semibold text-slate-900">Open report view</p>
                    <p className="text-xs text-slate-500">Hide match making and focus on interview records.</p>
                  </button>
                  <button
                    onClick={() => {
                      handleOpenRecruiterReport();
                      const latest = scheduledReports[0];
                      if (latest) {
                        downloadInterviewReport(latest);
                      }
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    <p className="font-semibold text-slate-900">Download Chat PDF</p>
                    <p className="text-xs text-slate-500">Download the full chat transcript as PDF.</p>
                  </button>
                  <button
                    onClick={() => {
                      handleOpenRecruiterReport();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    <p className="font-semibold text-slate-900">Download Chat Summary</p>
                    <p className="text-xs text-slate-500">Download a short summary of the interview.</p>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-outline flex items-center gap-2 relative" onClick={handleOpenCandidateInbox}>
              <Inbox className="w-4 h-4" />
              Inbox
              {candidateInboxUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {candidateInboxUnreadCount}
                </span>
              )}
            </button>
          )}
          {isRecruiterView ? (
            <div
              onClick={async () => {
                console.log('Profile clicked, recruiterProfile:', recruiterProfile);
                await refreshRecruiterProfile();
                setRecruitmentProfileOpen(true);
              }}
              className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer"
            >
              <img
                src={recruiterProfile?.avatar_url || 'https://i.pravatar.cc/100?img=5'}
                alt={recruiterProfile?.name || 'Profile'}
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover"
              />
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {recruiterProfile?.name || 'Pooja Mandal'}
                </p>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  {recruiterProfile?.role || 'Recruiter'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          ) : (
            <button
              onClick={() => setCandidateProfileFormOpen(true)}
              className="flex items-center gap-3 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full hover:bg-primary-100 transition-colors"
            >
              <img
                src={candidateProfile?.avatar || `https://i.pravatar.cc/100?u=${candidateProfile?.email || 'candidate'}`}
                alt={candidateProfile?.name || 'Profile'}
                className="w-10 h-10 rounded-full border border-primary-300 shadow-sm object-cover"
              />
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {candidateProfile?.name || 'Update Profile'}
                </p>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  {candidateProfile?.role || 'Candidate'}
                </p>
              </div>
              <Edit2 className="w-4 h-4 text-primary-600" />
            </button>
          )}
        </div>
      </header>

      <ChatModal
        isOpen={inboxOpen}
        candidate={null}
        jd={jd}
        recruiterProfile={recruiterProfile}
        candidateProfile={candidateProfile}
        viewerRole={isRecruiterView ? 'recruiter' : 'candidate'}
        onThreadsChange={setInterviewThreads}
        onClose={() => setInboxOpen(false)}
      />

      {recruitmentProfileOpen && recruiterProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setRecruitmentProfileOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 text-center">
              <img
                src={recruiterProfile.avatar_url}
                alt={recruiterProfile.name}
                className="mx-auto w-24 h-24 rounded-full border border-slate-200 shadow-sm object-cover mb-4"
              />
              <h3 className="text-2xl font-bold uppercase tracking-tight text-slate-900 mb-2">
                {recruiterProfile.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{recruiterProfile.role || 'Recruiter'}</p>
              <div className="space-y-3 text-left px-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</p>
                  <p className="text-base font-semibold text-slate-800 break-all">{recruiterProfile.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Company</p>
                  <p className="text-base font-bold uppercase text-slate-900">{recruiterProfile.company_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Role</p>
                  <p className="text-base font-semibold text-slate-800">{recruiterProfile.role}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Image</p>
                  <p className="text-base text-slate-800">Profile photo shown above</p>
                </div>
              </div>
              <button
                onClick={() => setRecruitmentProfileOpen(false)}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-2 text-white font-semibold shadow-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <CandidateProfileForm
        isOpen={candidateProfileFormOpen}
        onClose={() => setCandidateProfileFormOpen(false)}
        onSave={handleCandidateProfileSave}
      />

      {recruiterProfileFormOpen && (
        <RecruiterProfileForm
          isOpen={recruiterProfileFormOpen}
          onClose={() => setRecruiterProfileFormOpen(false)}
          onSave={handleRecruiterProfileSave}
          recruiterProfile={recruiterProfile}
        />
      )}

      {/* CANDIDATE VIEW */}
      {isCandidateView && (
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-surface pb-10">
          <div className="px-8 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
              <aside className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-card">
                  <button
                    onClick={() => setCandidateSection('profile')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors ${
                      candidateSection === 'profile'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => setCandidateSection('calendar')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors mt-1 ${
                      candidateSection === 'calendar'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    Calendar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors mt-1 text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>

              </aside>

              <section className="min-w-0 space-y-6">
                {candidateSection === 'calendar' ? (
                  <InterviewCalendar
                    title={calendarTitle}
                    monthDate={calendarMonth}
                    onPrev={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    events={activeCalendarEvents}
                  />
                ) : candidateProfile ? (
                  <>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
                      <div className="p-8 flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center md:items-start gap-4">
                          <img
                            src={getCandidateAvatar(candidateProfile)}
                            alt={candidateProfile.name}
                            className="w-32 h-32 rounded-full border-4 border-primary-100 shadow-lg object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={getCandidateAvatar(candidateProfile)}
                              alt={candidateProfile.name}
                              className="w-12 h-12 rounded-full border border-primary-100 shadow-sm object-cover"
                            />
                            <h3 className="text-3xl font-bold text-slate-900">{candidateProfile.name}</h3>
                          </div>
                          <p className="text-lg text-slate-600 font-semibold mb-1">{candidateProfile.role}</p>
                          <p className="text-slate-500 mb-4">{candidateProfile.company}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Email</p>
                              <p className="text-slate-700">{candidateProfile.email}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Phone</p>
                              <p className="text-slate-700">{candidateProfile.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Location</p>
                              <p className="text-slate-700">{candidateProfile.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Open to Work</p>
                              <p className="text-green-600 font-semibold">Yes</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {candidateProfile.bio && (
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-primary-600" />
                          Professional Summary
                        </h4>
                        <p className="text-slate-600 leading-relaxed">{getCandidateSummary(candidateProfile)}</p>
                      </div>
                    )}

                    {candidateProfile.skills && (
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-primary-600" />
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(candidateProfile.skills) ? candidateProfile.skills : candidateProfile.skills.split(',').map(s => s.trim())).map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-primary-50 border border-primary-200 text-primary-700 font-semibold rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {candidateProfile.experience && (
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">
                        <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-primary-600" />
                          Experience
                        </h4>
                        <p className="text-slate-600 leading-relaxed">{candidateProfile.experience}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8 flex items-center justify-center py-28 flex-col gap-4">
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                      <Edit2 className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No Profile Yet</p>
                    <p className="text-slate-500 text-center max-w-md">Start by creating your profile so recruiters can find you. Click "Update Profile" to get started.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* RECRUITER VIEW */}
      {isRecruiterView && (
        <div className="px-6 md:px-8 mt-6 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
            <aside className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-card">
                <button
                  onClick={() => setRecruiterSection('matchmaking')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors ${
                    recruiterSection === 'matchmaking'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  >
                  <LayoutGrid className="w-4 h-4" />
                  Match Making
                </button>
                <button
                  onClick={() => setRecruiterSection('calendar')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors mt-1 ${
                    recruiterSection === 'calendar'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setRecruiterProfileFormOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors mt-1 text-slate-600 hover:bg-slate-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Update Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold transition-colors mt-1 text-slate-600 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <h3 className="font-bold text-slate-900">Report</h3>
                </div>
                {scheduledReports.length === 0 ? (
                  <p className="text-sm text-slate-500">No interviews listed yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {scheduledReports.map((thread) => (
                      <button
                        key={thread.id}
                      onClick={handleOpenRecruiterReport}
                      className="w-full text-left rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50 transition-colors"
                    >
                        <p className="font-semibold text-slate-800 truncate">{thread.candidateName}</p>
                        <p className="text-xs text-slate-500 truncate">{thread.candidateRole}</p>
                        <p className="mt-2 text-xs font-semibold text-red-700">
                          {formatInterviewDate(thread.interviewDate)} {thread.preferredTime ? `• ${formatInterviewTime(thread.preferredTime)}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{thread.interviewMode} interview</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="min-w-0 space-y-6">
              {recruiterSection === 'matchmaking' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <MetricCard title="Total Shown" value={totalCards} trend="" icon={CandidatesIcon} iconBg="bg-purple-50" iconColor="text-purple-500" />
                    <MetricCard title="High Match (>80%)" value={highMatch} trend="Solid potentials" icon={MatchIcon} iconBg="bg-green-50" iconColor="text-green-500" />
                    <MetricCard title="Highly Interested" value={highInterest} trend="Top engagement" icon={ClockIcon} iconBg="bg-orange-50" iconColor="text-orange-500" />
                    <MetricCard title="Estimated Shortlist" value={shortlisted} trend="Pipeline flow" icon={CartIcon} iconBg="bg-blue-50" iconColor="text-blue-500" />
                    <MetricCard title="Avg Match Score" value={`${avgMatch}%`} trend="Dataset quality" icon={HeartIcon} iconBg="bg-pink-50" iconColor="text-pink-500" />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
                    <div className="flex-1 flex gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <span className="font-bold text-lg text-slate-600">JD</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight">Active Requirement</h3>
                          {!isEditingJd && <span className="badge-success">Live Analysis</span>}
                        </div>
                        {isEditingJd ? (
                          <div className="mt-2 flex gap-3 w-full max-w-2xl">
                            <textarea
                              value={draftJd}
                              onChange={(e) => {
                                setDraftJd(e.target.value);
                                if (jdError) setJdError('');
                              }}
                              placeholder="Enter a role like Data Scientist, Frontend Developer, or DevOps Engineer"
                              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                              rows="3"
                            />
                            <div className="flex flex-col gap-2">
                              <button onClick={handleJdSubmit} className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setIsEditingJd(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 truncate max-w-[800px] mb-1.5">
                            Search the role and matching candidates will show above, with everyone else listed under Suggested.
                          </p>
                        )}
                        {isEditingJd && jdError && (
                          <p className="mt-2 text-xs font-medium text-red-600">{jdError}</p>
                        )}
                      </div>
                    </div>
                    {!isEditingJd && (
                      <div className="flex items-center gap-8 border-l border-slate-200 pl-8">
                        <button onClick={() => { setDraftJd(jd); setIsEditingJd(true); }} className="btn-outline flex items-center gap-2 text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100">
                          <Edit2 className="w-4 h-4" /> Change JD Analysis
                        </button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20 flex-col gap-4">
                      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-slate-500 tracking-wide">Synthesizing AI Results for "{jd.substring(0, 20)}..."</p>
                    </div>
                  ) : (
                    <>
                      {filteredCandidates.length === 0 ? (
                        <div className="flex items-center justify-center py-20 flex-col gap-3 opacity-60">
                          <Search className="w-12 h-12 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-600">
                            {invalidRequirement ? 'Enter a valid requirement' : 'No candidates found matching criteria.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-8 pb-10">
                          <div className="space-y-3">
                            {hasRoleSearch && (
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Role Match</h4>
                                  <p className="text-xs text-slate-500">Candidates matching the selected role appear here first.</p>
                                </div>
                                <span className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-3 py-1">
                                  {roleMatchedCandidates.length}
                                </span>
                              </div>
                            )}
                            {hasRoleSearch && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {roleMatchedCandidates.slice(0, 24).map((candidate) => (
                                  <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    jd={jd}
                                    jdSkills={results.jdSkills}
                                    recruiterProfile={recruiterProfile}
                                    onThreadUpdate={setInterviewThreads}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                                  {hasRoleSearch ? 'Suggested' : 'Suggested Candidates'}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {hasRoleSearch
                                    ? 'The remaining candidates are listed here for review.'
                                    : 'Everyone is treated equally until a role is searched.'}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                                {suggestedCandidates.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                              {suggestedCandidates.slice(0, 24).map((candidate) => (
                                <CandidateCard
                                  key={candidate.id}
                                  candidate={candidate}
                                  jd={jd}
                                  jdSkills={results.jdSkills}
                                  recruiterProfile={recruiterProfile}
                                  onThreadUpdate={setInterviewThreads}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : recruiterSection === 'report' ? (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Chat</h3>
                        <p className="text-sm text-slate-500">
                          Download chat summaries and interview records without the match making content.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const latest = scheduledReports[0];
                            if (latest) downloadInterviewReport(latest);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                          disabled={scheduledReports.length === 0}
                        >
                          <FileText className="w-4 h-4" />
                          Download Chat PDF
                        </button>
                        <button
                          onClick={() => {
                            const latest = scheduledReports[0];
                            if (latest) downloadChatSummary(latest);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                          disabled={scheduledReports.length === 0}
                        >
                          <Download className="w-4 h-4" />
                          Download Chat Summary
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Interview Report</h3>
                        <p className="text-sm text-slate-500">Listed interviews and time slots appear here.</p>
                      </div>
                    </div>
                    {scheduledReports.length === 0 ? (
                      <p className="text-sm text-slate-500">No scheduled interviews yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {scheduledReports.map((thread) => (
                          <div key={`${thread.id}-report`} className="rounded-lg border border-red-100 bg-red-50/60 px-4 py-3">
                            <p className="font-semibold text-slate-900 truncate">{thread.candidateName}</p>
                            <p className="text-xs text-slate-500 truncate">{thread.candidateRole}</p>
                            <p className="mt-2 text-sm font-semibold text-red-700">
                              {formatInterviewDate(thread.interviewDate)} {thread.preferredTime ? `• ${formatInterviewTime(thread.preferredTime)}` : ''}
                            </p>
                            <p className="text-xs text-slate-600 capitalize">{thread.interviewMode} interview</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <InterviewCalendar
                    title={calendarTitle}
                    monthDate={calendarMonth}
                    onPrev={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    events={activeCalendarEvents}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
