const DISPLAY_ID_KEY = 'candidateDisplayIdRegistry';
const CANDIDATE_PROFILE_KEY = 'candidateProfile';
const ALL_CANDIDATES_KEY = 'allCandidates';
const DEFAULT_SUMMARY = 'A motivated professional with a passion for driving results and transforming ideas into impact.';

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function normalizeKey(candidate = {}) {
  return String(candidate.email || candidate.id || candidate.name || candidate.role || 'candidate').trim();
}

function loadRegistry() {
  const browser = safeWindow();
  if (!browser) {
    return { map: {}, used: [] };
  }

  try {
    const stored = browser.localStorage.getItem(DISPLAY_ID_KEY);
    if (!stored) return { map: {}, used: [] };
    const parsed = JSON.parse(stored);
    return {
      map: parsed?.map && typeof parsed.map === 'object' ? parsed.map : {},
      used: Array.isArray(parsed?.used) ? parsed.used.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 100) : [],
    };
  } catch (error) {
    console.warn('Failed to load candidate display id registry', error);
    return { map: {}, used: [] };
  }
}

function saveRegistry(registry) {
  const browser = safeWindow();
  if (!browser) return;

  try {
    browser.localStorage.setItem(DISPLAY_ID_KEY, JSON.stringify(registry));
  } catch (error) {
    console.warn('Failed to save candidate display id registry', error);
  }
}

export function getCandidateDisplayId(candidate = {}) {
  const key = normalizeKey(candidate);
  const registry = loadRegistry();

  if (registry.map[key] !== undefined) {
    return registry.map[key];
  }

  const used = new Set(registry.used);
  const available = [];

  for (let i = 0; i <= 100; i += 1) {
    if (!used.has(i)) {
      available.push(i);
    }
  }

  const nextId = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : 1000 + Math.floor(Math.random() * 9000);

  registry.map[key] = nextId;
  if (nextId >= 0 && nextId <= 100 && !registry.used.includes(nextId)) {
    registry.used.push(nextId);
  }
  saveRegistry(registry);

  return nextId;
}

function normalizeAvatarCandidate(candidate = {}) {
  return String(candidate.email || candidate.id || candidate.name || candidate.role || 'candidate').trim();
}

function readStoredAvatar(candidate = {}) {
  const browser = safeWindow();
  if (!browser) return '';

  const key = normalizeAvatarCandidate(candidate);

  try {
    const storedProfile = browser.localStorage.getItem(CANDIDATE_PROFILE_KEY);
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      const storedKey = normalizeAvatarCandidate(parsed);
      if (parsed?.avatar && (storedKey === key || parsed.email === candidate.email || parsed.name === candidate.name || parsed.id === candidate.id)) {
        return parsed.avatar;
      }
    }
  } catch (error) {
    console.warn('Failed to read candidate profile avatar', error);
  }

  try {
    const storedCandidates = browser.localStorage.getItem(ALL_CANDIDATES_KEY);
    if (storedCandidates) {
      const candidatesObj = JSON.parse(storedCandidates);
      const values = Object.values(candidatesObj || {});
      for (const storedCandidate of values) {
        if (!storedCandidate?.avatar) continue;
        const storedKey = normalizeAvatarCandidate(storedCandidate);
        if (storedKey === key || storedCandidate.email === candidate.email || storedCandidate.name === candidate.name || storedCandidate.id === candidate.id) {
          return storedCandidate.avatar;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read stored candidate avatar', error);
  }

  return '';
}

export function getCandidateAvatar(candidate = {}) {
  return candidate.avatar || readStoredAvatar(candidate) || `https://i.pravatar.cc/150?u=${normalizeAvatarCandidate(candidate)}`;
}

export function getCandidateSummary(candidate = {}) {
  return candidate.bio || candidate.explanation || DEFAULT_SUMMARY;
}
