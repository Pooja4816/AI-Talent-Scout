import { useState } from "react";
import RegisterCandidate from "../components/RegisterCandidate";
import Recruiterform from "../components/Recruiterform";

export default function Register() {
  const [role, setRole] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Register</h1>
        <div className="flex flex-col gap-4 mb-6 justify-center w-full">
          <button
            className={`w-full px-4 py-3 rounded-lg font-semibold shadow transition-colors duration-200 ${role === 'candidate' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            onClick={() => setRole("candidate")}
          >
            Register as Candidate
          </button>
          <button
            className={`w-full px-4 py-3 rounded-lg font-semibold shadow transition-colors duration-200 ${role === 'recruiter' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            onClick={() => setRole("recruiter")}
          >
            Register as Recruiter
          </button>
        </div>
        <div className="w-full">
          {role === "candidate" && <RegisterCandidate />}
          {role === "recruiter" && <Recruiterform />}
        </div>
      </div>
    </div>
  );
}