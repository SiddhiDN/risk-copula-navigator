import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient.ts';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleOTPLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Sending OTP to:", email);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'http://localhost:3000/dashboard'
    }
  });

  if (error) {
    console.error('OTP Login Error:', error);
    setMessage(`❌ ${error.message}`);
  } else {
    console.log("✅ OTP request sent");
    setMessage(`✅ OTP sent to ${email}. Check your inbox.`);
  }
};


  return (
    <form onSubmit={handleOTPLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="p-2 border rounded w-full"
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        Send OTP
      </button>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  );
}

