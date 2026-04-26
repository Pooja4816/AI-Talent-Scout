import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export default function RegisterCandidate() {
  const [isFresher, setIsFresher] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
    employeeId: '',
    workingSince: ''
  });
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError('Please fill all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // 1. Register user with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2. Insert into candidates table
    const user = data.user || (data.session && data.session.user);
    if (!user) {
      setError('User registration failed.');
      return;
    }
    const { error: insertError } = await supabase.from('candidates').insert([{
      user_id: user.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      role: form.role,
      employee_id: form.employeeId,
      working_since: form.workingSince,
    }]);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Save registration data to localStorage for profile auto-fill
    const registrationData = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      role: form.role,
      employeeId: form.employeeId,
      workingSince: form.workingSince,
      avatar: '',
    };
    const profileKey = `candidateProfile:${form.email}`;
    const registrationKey = `candidateRegistration:${form.email}`;
    const seedKey = `candidateProfileSeed:${form.email}`;
    window.localStorage.setItem('activeUserEmail', form.email);
    window.localStorage.setItem('activeCandidateEmail', form.email);
    window.localStorage.setItem('activeUserRole', 'candidate');
    window.localStorage.setItem(profileKey, JSON.stringify({
      ...registrationData,
      bio: '',
      skills: '',
      experience: '',
      openToWork: true,
    }));
    window.localStorage.setItem('candidateRegistration', JSON.stringify(registrationData));
    window.localStorage.setItem(registrationKey, JSON.stringify(registrationData));
    window.localStorage.setItem('candidateProfileSeed', JSON.stringify({
      ...registrationData,
      bio: '',
      skills: '',
      experience: '',
      openToWork: true,
    }));
    window.localStorage.setItem(seedKey, JSON.stringify({
      ...registrationData,
      bio: '',
      skills: '',
      experience: '',
      openToWork: true,
    }));

    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="text-center">
        <p className="mb-4 text-green-600 font-semibold">Registration successful!</p>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Go to Login</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-6 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" id="fresher" checked={isFresher} onChange={() => setIsFresher(!isFresher)} />
        <label htmlFor="fresher" className="text-sm">I am a Fresher</label>
      </div>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full px-3 py-2 border rounded-lg" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email ID" className="w-full px-3 py-2 border rounded-lg" />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="w-full px-3 py-2 border rounded-lg" />
      {!isFresher && (
        <>
          <input name="company" value={form.company} onChange={handleChange} placeholder="Current Company Name" className="w-full px-3 py-2 border rounded-lg" />
          <input name="role" value={form.role} onChange={handleChange} placeholder="Role (optional)" className="w-full px-3 py-2 border rounded-lg" />
          <input name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="Valid Employee ID" className="w-full px-3 py-2 border rounded-lg" />
          <input name="workingSince" value={form.workingSince} onChange={handleChange} placeholder="Working Since (YYYY-MM)" className="w-full px-3 py-2 border rounded-lg" />
        </>
      )}
      <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full px-3 py-2 border rounded-lg" />
      <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full px-3 py-2 border rounded-lg" />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 mt-2">Register</button>
    </form>
  );
}
