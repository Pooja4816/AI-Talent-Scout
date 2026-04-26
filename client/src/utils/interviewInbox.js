const THREADS_KEY = 'interviewThreads';
const REPORTS_KEY = 'interviewReports';
const SEEN_STATE_KEY = 'interviewSeenState';

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const MONTH_NAMES = Object.keys(MONTHS);

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function loadJson(key, fallback) {
  const browser = safeWindow();
  if (!browser) return fallback;

  try {
    const raw = browser.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key}`, error);
    return fallback;
  }
}

function saveJson(key, value) {
  const browser = safeWindow();
  if (!browser) return;
  browser.localStorage.setItem(key, JSON.stringify(value));
}

export function loadInterviewThreads() {
  return loadJson(THREADS_KEY, []);
}

export function saveInterviewThreads(threads) {
  saveJson(THREADS_KEY, threads);
}

export function loadInterviewReports() {
  return loadJson(REPORTS_KEY, []);
}

export function saveInterviewReports(reports) {
  saveJson(REPORTS_KEY, reports);
}

export function loadInterviewSeenState() {
  return loadJson(SEEN_STATE_KEY, {
    candidateInboxSeenAt: '',
    recruiterReportSeenAt: '',
  });
}

export function saveInterviewSeenState(state) {
  saveJson(SEEN_STATE_KEY, state);
}

export function markCandidateInboxSeen() {
  const state = loadInterviewSeenState();
  const nextState = {
    ...state,
    candidateInboxSeenAt: new Date().toISOString(),
  };
  saveInterviewSeenState(nextState);
  return nextState;
}

export function markRecruiterReportSeen() {
  const state = loadInterviewSeenState();
  const nextState = {
    ...state,
    recruiterReportSeenAt: new Date().toISOString(),
  };
  saveInterviewSeenState(nextState);
  return nextState;
}

function getMessageTime(message) {
  if (!message?.createdAt) return 0;
  const time = new Date(message.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getLastRecruiterMessageTime(thread = {}) {
  const recruiterMessages = Array.isArray(thread.messages)
    ? thread.messages.filter((message) => message.role === 'recruiter')
    : [];
  return recruiterMessages.reduce((latest, message) => Math.max(latest, getMessageTime(message)), 0);
}

export function getUnreadCandidateThreadCount(threads = [], candidateEmail = '', candidateName = '', seenAtIso = '') {
  const { candidateInboxSeenAt } = loadInterviewSeenState();
  const seenAt = seenAtIso
    ? new Date(seenAtIso).getTime()
    : candidateInboxSeenAt
      ? new Date(candidateInboxSeenAt).getTime()
      : 0;

  return threads.filter((thread) => {
    if (candidateEmail) {
      if (thread.candidateEmail !== candidateEmail) return false;
    } else if (candidateName) {
      if (thread.candidateName !== candidateName) return false;
    }

    return getLastRecruiterMessageTime(thread) > seenAt;
  }).length;
}

export function getUnreadReportCount(reports = [], seenAtIso = '') {
  const { recruiterReportSeenAt } = loadInterviewSeenState();
  const seenAt = seenAtIso
    ? new Date(seenAtIso).getTime()
    : recruiterReportSeenAt
      ? new Date(recruiterReportSeenAt).getTime()
      : 0;

  return reports.filter((report) => getMessageTime(report) > seenAt).length;
}

function getCandidateKey(candidate = {}) {
  return candidate.email || candidate.id || candidate.name || 'candidate';
}

export function getThreadId(candidate = {}, recruiter = {}) {
  return `thread-${getCandidateKey(candidate)}-${recruiter.employee_id || recruiter.email || recruiter.name || 'recruiter'}`;
}

export function getCandidateLabel(candidate = {}) {
  return candidate.name || candidate.email || 'Candidate';
}

export function getRecruiterLabel(recruiter = {}) {
  return recruiter.name || 'Recruiter';
}

export function buildThread(candidate = {}, recruiter = {}, jd = '') {
  const now = new Date().toISOString();
  const id = getThreadId(candidate, recruiter);
  const recruiterName = getRecruiterLabel(recruiter);

  return {
    id,
    candidateId: getCandidateKey(candidate),
    candidateName: getCandidateLabel(candidate),
    candidateEmail: candidate.email || '',
    candidateRole: candidate.role || '',
    candidateAvatar: candidate.avatar || '',
    recruiterName,
    recruiterRole: recruiter.role || 'Recruiter',
    jd,
    stage: 'opening',
    status: 'open',
    preferredTime: '',
    interviewDate: '',
    interviewMode: '',
    preferredDate: '',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `${id}-seed`,
        role: 'recruiter',
        text: `Hello, my name is ${recruiterName}. I am very much impressed by your profile, ${getCandidateLabel(candidate)}. Are you open to work?`,
        createdAt: now,
      },
    ],
  };
}

export function ensureThread(candidate = {}, recruiter = {}, jd = '') {
  const threads = loadInterviewThreads();
  const id = getThreadId(candidate, recruiter);
  let thread = threads.find((item) => item.id === id);

  if (!thread) {
    thread = buildThread(candidate, recruiter, jd);
    threads.unshift(thread);
    saveInterviewThreads(threads);
  } else if (candidate.avatar && thread.candidateAvatar !== candidate.avatar) {
    thread = {
      ...thread,
      candidateAvatar: candidate.avatar,
      candidateName: candidate.name || thread.candidateName,
      candidateEmail: candidate.email || thread.candidateEmail,
      candidateRole: candidate.role || thread.candidateRole,
    };
    upsertThread(thread);
  }

  return thread;
}

export function upsertThread(nextThread) {
  const threads = loadInterviewThreads();
  const index = threads.findIndex((item) => item.id === nextThread.id);

  if (index >= 0) {
    threads[index] = nextThread;
  } else {
    threads.unshift(nextThread);
  }

  saveInterviewThreads(threads);
  return nextThread;
}

function normalizeText(value = '') {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function includesAny(text, list) {
  return list.some((term) => text.includes(term));
}

function isPositiveReply(text) {
  return includesAny(normalizeText(text), ['yes', 'yeah', 'yep', 'sure', 'open to work', 'interested', 'absolutely']);
}

function isNegativeReply(text) {
  return includesAny(normalizeText(text), ['no', 'not right now', 'not now', 'later', 'maybe later', 'currently not', 'not open']);
}

function parseDateFromText(text, baseDate = new Date()) {
  const value = normalizeText(text);
  const isoMatch = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const monthPattern = MONTH_NAMES.join('|');
  const monthFirst = value.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
  const dayFirst = value.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\b`, 'i'));

  const source = monthFirst || dayFirst;
  if (source) {
    const monthName = (monthFirst ? source[1] : source[2]).toLowerCase();
    const day = Number(monthFirst ? source[2] : source[1]);
    const year = value.match(/\b(20\d{2})\b/) ? Number(value.match(/\b(20\d{2})\b/)[1]) : baseDate.getFullYear();
    const parsed = new Date(year, MONTHS[monthName], day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const looseDay = value.match(/\b(0?[1-9]|[12]\d|3[01])\b/);
  if (looseDay && /april|may|june|july|august|september|october|november|december|january|february|march/.test(value)) {
    const monthMatch = value.match(new RegExp(monthPattern, 'i'));
    const year = value.match(/\b(20\d{2})\b/) ? Number(value.match(/\b(20\d{2})\b/)[1]) : baseDate.getFullYear();
    const parsed = new Date(year, MONTHS[monthMatch[0].toLowerCase()], Number(looseDay[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function parseInterviewMode(text) {
  const value = normalizeText(text);
  if (includesAny(value, ['online', 'virtual', 'video', 'remote'])) return 'online';
  if (includesAny(value, ['offline', 'onsite', 'on site', 'in person', 'in-person'])) return 'offline';
  return '';
}

function parseTimeFromText(text) {
  const value = normalizeText(text);
  const ampmMatch = value.match(/\b(0?[1-9]|1[0-2])(:[0-5]\d)?\s?(am|pm)\b/i);
  if (ampmMatch) {
    const hour = Number(ampmMatch[1]);
    const minutes = ampmMatch[2] ? Number(ampmMatch[2].slice(1)) : 0;
    const meridiem = ampmMatch[3].toLowerCase();
    const normalizedHour = meridiem === 'pm' && hour !== 12 ? hour + 12 : meridiem === 'am' && hour === 12 ? 0 : hour;
    return {
      time: `${String(normalizedHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      hasMeridiem: true,
      display: `${hour}:${String(minutes).padStart(2, '0')} ${meridiem.toUpperCase()}`,
    };
  }

  const twentyFourHourMatch = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (twentyFourHourMatch) {
    const hour24 = Number(twentyFourHourMatch[1]);
    const minutes = twentyFourHourMatch[2];
    const hour12 = hour24 % 12 || 12;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    return {
      time: `${String(hour24).padStart(2, '0')}:${minutes}`,
      hasMeridiem: true,
      display: `${hour12}:${minutes} ${meridiem}`,
    };
  }

  const looseTimeMatch = value.match(/\b(0?[1-9]|1[0-2])(?:\s*o'?clock)?\b/);
  if (looseTimeMatch) {
    const hour = Number(looseTimeMatch[1]);
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      hasMeridiem: false,
      display: `${hour}:00`,
    };
  }

  return null;
}

function formatStoredTime(timeLike = '') {
  const value = String(timeLike).trim();
  if (!value) return '';

  const ampmMatch = value.match(/^(\d{2}):(\d{2})\s?(am|pm)$/i);
  if (ampmMatch) {
    const hour24 = Number(ampmMatch[1]);
    const minutes = ampmMatch[2];
    const meridiem = ampmMatch[3].toUpperCase();
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${meridiem}`;
  }

  const twentyFourHourMatch = value.match(/^(\d{2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour24 = Number(twentyFourHourMatch[1]);
    const minutes = twentyFourHourMatch[2];
    const hour12 = hour24 % 12 || 12;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${meridiem}`;
  }

  return value;
}

export function formatInterviewTime(timeLike = '') {
  return formatStoredTime(timeLike);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

export function formatInterviewDate(dateLike) {
  if (!dateLike) return '';
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  return Number.isNaN(date.getTime()) ? '' : formatDate(date);
}

export function formatInterviewWeekday(dateLike) {
  if (!dateLike) return '';
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  return Number.isNaN(date.getTime()) ? '' : formatWeekday(date);
}

function getSummaryLine(thread) {
  if (!thread.interviewDate) return 'Pending schedule';
  const date = formatInterviewDate(thread.interviewDate);
  const mode = thread.interviewMode || 'unspecified';
  const time = thread.preferredTime ? ` @ ${formatStoredTime(thread.preferredTime)}` : '';
  return `${date}${time} | ${mode}`;
}

export function getScheduledEvents(threads = [], candidateEmail = '') {
  return threads
    .filter((thread) => thread.stage === 'scheduled' && thread.interviewDate)
    .filter((thread) => !candidateEmail || thread.candidateEmail === candidateEmail)
    .map((thread) => ({
      id: thread.id,
      title: thread.candidateName,
      date: thread.interviewDate,
      time: thread.preferredTime || '',
      mode: thread.interviewMode,
      candidateName: thread.candidateName,
      candidateRole: thread.candidateRole,
    }));
}

export function getThreadPreview(thread) {
  const lastMessage = thread.messages[thread.messages.length - 1];
  return lastMessage?.text || 'New outreach started';
}

export function processThreadReply(thread, replyText) {
  const now = new Date().toISOString();
  const nextThread = {
    ...thread,
    updatedAt: now,
    messages: [
      ...thread.messages,
      {
        id: `${thread.id}-${thread.messages.length + 1}`,
        role: 'candidate',
        text: replyText.trim(),
        createdAt: now,
      },
    ],
  };

  const normalized = normalizeText(replyText);
  let recruiterReply;
  const updates = {};

  if (thread.stage === 'opening') {
    if (isPositiveReply(normalized)) {
      updates.stage = 'awaiting_time';
      recruiterReply = 'Great. Please share your preferred interview time slot first.';
    } else if (isNegativeReply(normalized)) {
      updates.stage = 'awaiting_time';
      recruiterReply = 'No problem. What time will you be free for the interview?';
    } else {
      recruiterReply = 'Thank you for the response. Are you open to work?';
    }
  } else if (thread.stage === 'awaiting_time') {
    const parsedTime = parseTimeFromText(replyText);
    const unavailable = includesAny(normalized, ['not available', 'cannot', "can't", 'busy', 'unavailable', 'another time', 'different time', 'not possible']);

    if (!parsedTime || unavailable) {
      recruiterReply = 'Understood. What time will you be free for the interview?';
    } else if (!parsedTime.hasMeridiem) {
      updates.stage = 'awaiting_time_meridiem';
      updates.pendingTime = parsedTime.time;
      recruiterReply = `Thanks. Is ${parsedTime.display} AM or PM?`;
    } else {
      updates.stage = 'awaiting_date';
      updates.preferredTime = parsedTime.time;
      recruiterReply = `Thanks. We have noted ${parsedTime.display}. Please share the preferred interview date.`;
    }
  } else if (thread.stage === 'awaiting_time_meridiem') {
    const parsedMeridiem = normalizeText(replyText);
    const pendingTime = thread.pendingTime || '';
    const meridiem = includesAny(parsedMeridiem, ['am', 'morning'])
      ? 'AM'
      : includesAny(parsedMeridiem, ['pm', 'afternoon', 'evening', 'night'])
        ? 'PM'
        : '';

    if (!pendingTime || !meridiem) {
      recruiterReply = 'Please reply with AM or PM so I can save the interview time.';
    } else {
      const hour = Number(pendingTime.split(':')[0]);
      const minutes = pendingTime.split(':')[1] || '00';
      const hour12 = hour % 12 || 12;
      const normalizedHour = meridiem === 'PM' && hour !== 12 ? hour + 12 : meridiem === 'AM' && hour === 12 ? 0 : hour;
      updates.stage = 'awaiting_date';
      updates.pendingTime = '';
      updates.preferredTime = `${String(normalizedHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      recruiterReply = `Thanks. We have noted ${hour12}:${minutes} ${meridiem}. Please share the preferred interview date.`;
    }
  } else if (thread.stage === 'awaiting_date') {
    const parsedDate = parseDateFromText(replyText);
    const unavailable = includesAny(normalized, ['not available', 'cannot', "can't", 'busy', 'unavailable', 'another day', 'different day']);

    if (!parsedDate || unavailable) {
      recruiterReply = 'Understood. Please share another preferred day and date so I can place it on the calendar.';
    } else {
      updates.stage = 'awaiting_mode';
      updates.preferredDate = parsedDate.toISOString();
      updates.interviewDate = parsedDate.toISOString();
      recruiterReply = `Thanks. We have penciled in ${formatDate(parsedDate)}. Would you like the interview online or offline?`;
    }
  } else if (thread.stage === 'awaiting_mode') {
    const mode = parseInterviewMode(replyText);
    if (!mode) {
      recruiterReply = 'Please reply with online or offline for the interview format.';
    } else {
      updates.stage = 'scheduled';
      updates.status = 'scheduled';
      updates.interviewMode = mode;
      const scheduledDate = thread.interviewDate || thread.preferredDate;
      recruiterReply = scheduledDate
        ? `Perfect. Your ${mode} interview is scheduled for ${formatDate(new Date(scheduledDate))} (${formatWeekday(new Date(scheduledDate))}).`
        : `Perfect. Your ${mode} interview is scheduled.`;
    }
  } else {
    recruiterReply = 'This interview is already scheduled and reflected in the calendar.';
  }

  nextThread.messages.push({
    id: `${thread.id}-${nextThread.messages.length + 1}`,
    role: 'recruiter',
    text: recruiterReply,
    createdAt: now,
  });

  const merged = {
    ...nextThread,
    ...updates,
    preferredTime: updates.preferredTime || nextThread.preferredTime || thread.preferredTime || '',
    interviewDate: updates.interviewDate || nextThread.interviewDate || thread.interviewDate || '',
    interviewMode: updates.interviewMode || nextThread.interviewMode || thread.interviewMode || '',
    preferredDate: updates.preferredDate || nextThread.preferredDate || thread.preferredDate || '',
    status: updates.status || nextThread.status || thread.status || 'open',
  };

  const saved = upsertThread(merged);

  if (saved.stage === 'scheduled' && saved.interviewDate && saved.interviewMode) {
    const reports = loadInterviewReports();
    const reportId = `${saved.id}-${saved.interviewDate}`;
    const reportExists = reports.some((report) => report.id === reportId);

    if (!reportExists) {
      reports.unshift({
        id: reportId,
        threadId: saved.id,
        candidateName: saved.candidateName,
        candidateRole: saved.candidateRole,
        interviewDate: saved.interviewDate,
        preferredTime: saved.preferredTime,
        interviewMode: saved.interviewMode,
        summary: getSummaryLine(saved),
        createdAt: now,
      });
      saveInterviewReports(reports);
    }
  }

  return saved;
}

export function processRecruiterReply(thread, replyText) {
  const now = new Date().toISOString();
  const nextThread = {
    ...thread,
    updatedAt: now,
    messages: [
      ...thread.messages,
      {
        id: `${thread.id}-${thread.messages.length + 1}`,
        role: 'recruiter',
        text: replyText.trim(),
        createdAt: now,
      },
    ],
  };

  return upsertThread(nextThread);
}

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function createInterviewReportPdf(thread) {
  const lines = [
    'Chat PDF',
    `Candidate: ${thread.candidateName}`,
    `Resume: ${thread.candidateRole || 'Candidate profile'}`,
    `Time Slot: ${formatInterviewTime(thread.preferredTime) || 'Pending'}`,
    `Interview: ${thread.interviewMode || 'online/offline'}`,
    `Date: ${formatInterviewDate(thread.interviewDate) || 'Pending'}`,
    `Status: ${thread.stage === 'scheduled' ? 'Scheduled' : 'Pending'}`,
    '',
    'Chat Transcript',
    ...thread.messages.flatMap((message) => [
      `${message.role === 'recruiter' ? 'Recruiter' : 'Candidate'}: ${message.text}`,
    ]),
  ];

  const contentLines = lines.map((line, index) => {
    const y = 760 - index * 22;
    const size = index === 0 ? 18 : line === 'Chat Transcript' ? 13 : 11;
    return `BT /F1 ${size} Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`;
  });

  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f '];
  objects.forEach((object) => {
    offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n ');
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `${offsets.join('\n')}\n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function createChatSummaryPdf(thread) {
  const lines = [
    'Chat Summary',
    `Candidate: ${thread.candidateName}`,
    `Resume: ${thread.candidateRole || 'Candidate profile'}`,
    `Time Slot: ${formatInterviewTime(thread.preferredTime) || 'Pending'}`,
    `Interview: ${thread.interviewMode || 'online/offline'}`,
    `Date: ${formatInterviewDate(thread.interviewDate) || 'Pending'}`,
    `Status: ${thread.stage === 'scheduled' ? 'Scheduled' : 'Pending'}`,
    `Summary: ${thread.summary || getSummaryLine(thread)}`,
  ];

  const contentLines = lines.map((line, index) => {
    const y = 760 - index * 26;
    const size = index === 0 ? 18 : 12;
    return `BT /F1 ${size} Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`;
  });

  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f '];
  objects.forEach((object) => {
    offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n ');
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `${offsets.join('\n')}\n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadInterviewReport(thread) {
  const browser = safeWindow();
  if (!browser) return;

  const blob = createInterviewReportPdf(thread);
  const url = URL.createObjectURL(blob);
  const anchor = browser.document.createElement('a');
  anchor.href = url;
  anchor.download = `${thread.candidateName.replace(/\s+/g, '_')}_Interview_Report.pdf`;
  browser.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadChatSummary(thread) {
  const browser = safeWindow();
  if (!browser) return;

  const blob = createChatSummaryPdf(thread);
  const url = URL.createObjectURL(blob);
  const anchor = browser.document.createElement('a');
  anchor.href = url;
  anchor.download = `${thread.candidateName.replace(/\s+/g, '_')}_Chat_Summary.pdf`;
  browser.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
