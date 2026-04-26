import { useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function CandidateForm() {
  const [isFresher, setIsFresher] = useState(false);
  const [form, setForm] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // 1. Create user
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) return alert(error.message);

    const user = data.user;

    // 2. Insert candidate data
    await supabase.from("candidates").insert([
      {
        user_id: user.id,
        name: form.name,
        phone: form.phone,
        is_fresher: isFresher,
        current_company: isFresher ? null : form.company,
        joining_date: isFresher ? null : form.joining,
        experience: isFresher ? 0 : form.experience,
      },
    ]);

    alert("Registered Successfully");
  };

  return (
    <div>
      <h2>Candidate</h2>

      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />

      <label>
        Fresher?
        <input type="checkbox" onChange={() => setIsFresher(!isFresher)} />
      </label>

      {!isFresher && (
        <>
          <input name="company" placeholder="Current Company" onChange={handleChange} />
          <input name="joining" placeholder="Joining Date" onChange={handleChange} />
          <input name="experience" placeholder="Experience" onChange={handleChange} />
        </>
      )}

      <button onClick={handleSubmit}>Register</button>
    </div>
  );
}