import { useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function RecruiterForm() {
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) return alert(error.message);

    const user = data.user;
    const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(form.email || form.empId || form.name)}`;

    const { error: insertError } = await supabase.from("recruiters").insert([
      {
        user_id: user.id,
        company_name: form.company,
        location: form.location,
        started_year: form.year,
        md_name: form.md,
        role: form.role,
        employee_id: form.empId,
        phone: form.phone,
        name: form.name,
      },
    ]);

    if (insertError) {
      return alert(insertError.message);
    }

    const recruiterProfile = {
      name: form.name,
      email: form.email,
      company_name: form.company,
      employee_id: form.empId,
      location: form.location,
      role: form.role,
      phone: form.phone,
      md_name: form.md,
      started_year: form.year,
      avatar_url: avatarUrl,
    };
    const profileKey = `recruiterProfile:${form.email}`;
    const registrationKey = `recruiterRegistration:${form.email}`;
    window.localStorage.setItem('activeUserEmail', form.email);
    window.localStorage.setItem('activeRecruiterEmail', form.email);
    window.localStorage.setItem('activeUserRole', 'recruiter');

    window.localStorage.setItem("recruiterRegistration", JSON.stringify({
      name: form.name,
      email: form.email,
      company_name: form.company,
      company: form.company,
      employee_id: form.empId,
      location: form.location,
      role: form.role,
      phone: form.phone,
      md_name: form.md,
      started_year: form.year,
      avatar_url: avatarUrl,
    }));
    window.localStorage.setItem("recruiterProfile", JSON.stringify(recruiterProfile));
    window.localStorage.setItem(profileKey, JSON.stringify(recruiterProfile));
    window.localStorage.setItem(registrationKey, JSON.stringify({
      name: form.name,
      email: form.email,
      company_name: form.company,
      company: form.company,
      employee_id: form.empId,
      location: form.location,
      role: form.role,
      phone: form.phone,
      md_name: form.md,
      started_year: form.year,
      avatar_url: avatarUrl,
    }));
    alert("Recruiter Registered");
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4 bg-white rounded-xl shadow p-6 mt-4">
      <h2 className="text-xl font-bold text-purple-700 mb-4">Recruiter Registration</h2>
      <input className="w-full px-3 py-2 border rounded-lg" name="company" placeholder="Company Name" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="location" placeholder="Location" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="year" placeholder="Started Year" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="md" placeholder="MD Name" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="name" placeholder="Your Name" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="phone" placeholder="Phone" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="role" placeholder="Role in Company" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="empId" placeholder="Employee ID" onChange={handleChange} required />
      <input className="w-full px-3 py-2 border rounded-lg" name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit" className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-purple-700 transition-colors duration-200 mt-2">Register</button>
    </form>
  );
}
