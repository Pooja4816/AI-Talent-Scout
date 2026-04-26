import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Upload, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

function getActiveRecruiterEmail(fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem('activeRecruiterEmail') || window.localStorage.getItem('activeUserEmail') || fallback;
}

export default function RecruiterProfileForm({ isOpen, onClose, onSave, recruiterProfile }) {
  const [saving, setSaving] = useState(false);
  const activeEmail = getActiveRecruiterEmail(recruiterProfile?.email || '');
  const [form, setForm] = useState({
    name: recruiterProfile?.name || '',
    email: recruiterProfile?.email || activeEmail || '',
    company_name: recruiterProfile?.company_name || recruiterProfile?.company || '',
    employee_id: recruiterProfile?.employee_id || '',
    location: recruiterProfile?.location || '',
    role: recruiterProfile?.role || '',
    phone: recruiterProfile?.phone || '',
    md_name: recruiterProfile?.md_name || '',
    started_year: recruiterProfile?.started_year || '',
    avatar_url: recruiterProfile?.avatar_url || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((current) => ({ ...current, avatar_url: event.target?.result || current.avatar_url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const activeEmail = getActiveRecruiterEmail(form.email);
    const finalEmail = form.email || activeEmail;
    const avatarUrl = form.avatar_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(finalEmail || form.employee_id || form.name || 'recruiter')}`;

    const profileData = {
      ...form,
      email: finalEmail,
      avatar_url: avatarUrl,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('recruiterProfile', JSON.stringify(profileData));
      window.localStorage.setItem('recruiterRegistration', JSON.stringify(profileData));
      if (finalEmail) {
        window.localStorage.setItem(`recruiterProfile:${finalEmail}`, JSON.stringify(profileData));
        window.localStorage.setItem(`recruiterRegistration:${finalEmail}`, JSON.stringify(profileData));
      }
      window.localStorage.setItem('activeRecruiterEmail', finalEmail);
      window.localStorage.setItem('activeUserEmail', finalEmail);
      window.localStorage.setItem('activeUserRole', 'recruiter');
    }

    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      if (user?.id) {
        const { error } = await supabase
          .from('recruiters')
          .upsert(
            [{
              user_id: user.id,
              name: profileData.name,
              email: profileData.email,
              company_name: profileData.company_name,
              employee_id: profileData.employee_id,
              location: profileData.location,
              role: profileData.role,
              phone: profileData.phone,
              md_name: profileData.md_name,
              started_year: profileData.started_year,
            }],
            { onConflict: 'user_id' }
          );

        if (error) {
          console.warn('Failed to save recruiter profile to Supabase', error);
        }
      }
    } catch (error) {
      console.warn('Failed to refresh recruiter profile user', error);
    }

    onSave?.(profileData);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

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
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Update Recruiter Profile</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt={form.name || 'Recruiter'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-xs">No image</span>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50" readOnly />
            <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="employee_id" value={form.employee_id} onChange={handleChange} placeholder="Employee ID" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="md_name" value={form.md_name} onChange={handleChange} placeholder="MD Name" className="w-full px-4 py-3 border border-slate-200 rounded-lg" required />
            <input name="started_year" value={form.started_year} onChange={handleChange} placeholder="Started Year" className="w-full px-4 py-3 border border-slate-200 rounded-lg md:col-span-2" required />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
