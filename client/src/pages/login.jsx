import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('');
  const [view, setView] = useState('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      return;
    }
    if (data?.user) {
      const activeEmail = data.user.email || email;
      window.localStorage.setItem('activeUserEmail', activeEmail);
      window.localStorage.setItem('activeUserRole', selectedRole);
      window.localStorage.setItem(`active${selectedRole === 'recruiter' ? 'Recruiter' : 'Candidate'}Email`, activeEmail);
      navigate(`/${selectedRole}-dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      <div className="flex justify-end p-6">
        <button
          onClick={() => navigate('/register')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow hover:bg-blue-100 transition-colors"
        >
          <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">R</span>
          <span className="font-semibold text-blue-700">Register</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-4xl">
          <div className="bg-white bg-opacity-80 rounded-3xl p-8 mb-10 shadow-lg">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500 mb-4">Welcome back</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Login as a candidate or recruiter</h1>
            <p className="text-slate-500 max-w-2xl mx-auto">Select your role below to continue to your dashboard.</p>
          </div>

          {view === 'select' ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <button
                onClick={() => {
                  setSelectedRole('candidate');
                  setView('form');
                }}
                className="rounded-3xl bg-white p-10 shadow-lg hover:shadow-2xl transition-all duration-200 text-left"
              >
                <p className="text-sm text-slate-400 uppercase tracking-[0.3em] mb-4">Candidate</p>
                <h2 className="text-2xl font-bold text-slate-900">Login as Candidate</h2>
                <p className="mt-3 text-slate-500">Access your candidate dashboard, view matches, and update your profile.</p>
              </button>

              <button
                onClick={() => {
                  setSelectedRole('recruiter');
                  setView('form');
                }}
                className="rounded-3xl bg-white p-10 shadow-lg hover:shadow-2xl transition-all duration-200 text-left"
              >
                <p className="text-sm text-slate-400 uppercase tracking-[0.3em] mb-4">Recruiter</p>
                <h2 className="text-2xl font-bold text-slate-900">Login as Recruiter</h2>
                <p className="mt-3 text-slate-500">Sign in to manage openings, review candidates, and submit job briefs.</p>
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-xl bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-600">{selectedRole} login</p>
                  <h2 className="text-2xl font-bold text-slate-900">Sign in to continue</h2>
                </div>
                <button onClick={() => setView('select')} className="text-sm text-blue-600 hover:underline">Back</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="email"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
                >
                  Continue as {selectedRole}
                </button>
                {error && <div className="text-red-500 text-center">{error}</div>}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
