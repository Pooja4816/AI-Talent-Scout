import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Check } from 'lucide-react';
import mockCandidates from '../data/mockCandidates';

const CANDIDATE_ID_KEY = 'candidateIdRegistry';

function getActiveEmail() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('activeCandidateEmail') || window.localStorage.getItem('activeUserEmail') || '';
}

function loadUsedCandidateIds() {
  const ids = new Set(mockCandidates.map((candidate) => Number(candidate.id)).filter((id) => Number.isFinite(id)));

  try {
    const stored = window.localStorage.getItem(CANDIDATE_ID_KEY);
    if (stored) {
      JSON.parse(stored).forEach((id) => ids.add(Number(id)));
    }
  } catch (error) {
    console.warn('Failed to load candidate id registry', error);
  }

  try {
    const storedCandidates = window.localStorage.getItem('allCandidates');
    if (storedCandidates) {
      const candidatesObj = JSON.parse(storedCandidates);
      Object.values(candidatesObj).forEach((candidate) => {
        if (candidate?.id !== undefined) {
          ids.add(Number(candidate.id));
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load existing candidate ids', error);
  }

  return ids;
}

function allocateCandidateId() {
  const usedIds = loadUsedCandidateIds();
  const available = [];
  for (let i = 0; i <= 100; i += 1) {
    if (!usedIds.has(i)) {
      available.push(i);
    }
  }

  if (available.length === 0) return 1000;
  const nextId = available[Math.floor(Math.random() * available.length)];

  try {
    window.localStorage.setItem(CANDIDATE_ID_KEY, JSON.stringify([...usedIds, nextId]));
  } catch (error) {
    console.warn('Failed to persist candidate id registry', error);
  }

  return nextId;
}

export default function CandidateProfileForm({ isOpen, onClose, onSave }) {
  const [openToWork, setOpenToWork] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
    avatar: '',
    openToWork: true,
  });

  useEffect(() => {
    queueMicrotask(() => {
      const activeEmail = getActiveEmail();
      const profileKeys = activeEmail
        ? [
            `candidateProfile:${activeEmail}`,
            'candidateProfile',
            `candidateRegistration:${activeEmail}`,
            'candidateRegistration',
            `candidateProfileSeed:${activeEmail}`,
            'candidateProfileSeed',
          ]
        : ['candidateProfile', 'candidateRegistration', 'candidateProfileSeed'];

      // First try to load saved profile
      for (const key of profileKeys) {
        const storedProfile = window.localStorage.getItem(key);
        if (!storedProfile) continue;
        try {
          const parsed = JSON.parse(storedProfile);
          setForm(parsed);
          setOpenToWork(parsed.openToWork ?? null);
          return;
        } catch (error) {
          console.warn('Failed to parse candidate profile', error);
        }
      }

      // If no profile, try to auto-fill from registration data
      for (const key of profileKeys) {
        const registrationData = window.localStorage.getItem(key);
        if (!registrationData) continue;
        try {
          const parsed = JSON.parse(registrationData);
          const seedProfile = {
            name: parsed.name || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            role: parsed.role || '',
            company: parsed.company || '',
            location: parsed.location || '',
            bio: parsed.bio || '',
            skills: parsed.skills || '',
            experience: parsed.experience || '',
            avatar: parsed.avatar || '',
            openToWork: true,
          };
          setForm(seedProfile);
          window.localStorage.setItem('candidateProfile', JSON.stringify(seedProfile));
          if (parsed.email) {
            window.localStorage.setItem(`candidateProfile:${parsed.email}`, JSON.stringify(seedProfile));
          }
          return;
        } catch (error) {
          console.warn('Failed to parse registration data', error);
        }
      }
    });
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm({ ...form, avatar: event.target?.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedId = Number(form.id);
    const allocatedId = Number.isFinite(parsedId) && parsedId >= 0 && parsedId <= 100
      ? parsedId
      : allocateCandidateId();

    const profileData = {
      ...form,
      id: allocatedId,
      openToWork: true,
      skills: form.skills.split(',').map(s => s.trim()).filter(s => s),
      explanation: form.bio,
    };
    
    // Save current candidate profile
    window.localStorage.setItem('candidateProfile', JSON.stringify(profileData));
    if (form.email) {
      window.localStorage.setItem(`candidateProfile:${form.email}`, JSON.stringify(profileData));
      window.localStorage.setItem(`candidateRegistration:${form.email}`, JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        role: form.role,
        employeeId: form.employeeId,
        workingSince: form.workingSince,
        avatar: form.avatar,
      }));
      window.localStorage.setItem(`candidateProfileSeed:${form.email}`, JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        role: form.role,
        employeeId: form.employeeId,
        workingSince: form.workingSince,
        avatar: form.avatar,
        bio: '',
        skills: '',
        experience: '',
        openToWork: true,
      }));
    }
    
    // Also add to candidates list for recruiter view
    const candidatesKey = 'allCandidates';
    let allCandidates = {};
    try {
      const stored = window.localStorage.getItem(candidatesKey);
      if (stored) {
        allCandidates = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse all candidates', error);
    }
    
    // Store by email as unique key
    if (form.email) {
      allCandidates[form.email] = {
        ...profileData,
        id: profileData.id,
      };
      window.localStorage.setItem(candidatesKey, JSON.stringify(allCandidates));
    }
    
    onSave(profileData);
    setOpenToWork(null);
    onClose();
  };

  if (!isOpen) return null;

  // Show openToWork question first
  if (openToWork === null) {
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
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Update Profile</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 text-center space-y-6">
            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-3">Are you open to work?</h4>
              <p className="text-slate-500 text-sm">Let recruiters know if you're looking for new opportunities.</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setOpenToWork(false);
                  onClose();
                }}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Not Right Now
              </button>
              <button
                onClick={() => setOpenToWork(true)}
                className="flex-1 px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-lg transition-colors"
              >
                Yes, I'm Open
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Update Profile</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-3 overflow-hidden bg-slate-50">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <label className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors cursor-pointer font-semibold text-sm">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="col-span-2 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            />
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="role"
              placeholder="Current Role"
              value={form.role}
              onChange={handleChange}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              required
            />
            <input
              type="text"
              name="company"
              placeholder="Company"
              value={form.company}
              onChange={handleChange}
              className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="col-span-2 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Bio */}
          <textarea
            name="bio"
            placeholder="Professional Summary"
            value={form.bio}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
          />

          {/* Skills */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Skills (comma-separated)</label>
            <textarea
              name="skills"
              placeholder="e.g. Python, SQL, Machine Learning, TensorFlow"
              value={form.skills}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Experience</label>
            <textarea
              name="experience"
              placeholder="Describe your work experience"
              value={form.experience}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save Profile
          </button>
        </form>
      </motion.div>
    </div>
  );
}
