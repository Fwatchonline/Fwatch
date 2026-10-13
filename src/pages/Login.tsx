import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronDown, Check } from 'lucide-react';
import { SEO } from '../components/SEO';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0E0F12] text-white flex flex-col justify-between relative overflow-hidden select-none">
      <SEO
        title="Login - Tstream"
        description="Sign in to your Tstream account to access watchlist and personalized recommendations."
      />

      {/* Top Navigation Bar */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center">
          T<span className="text-[#E50914]">stream</span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold text-neutral-300">
          <Link to="/" className="hover:text-[#E50914] transition-colors">
            Home
          </Link>
          <Link to="/about" className="hover:text-[#E50914] transition-colors">
            About
          </Link>
          <Link to="/contact" className="hover:text-[#E50914] transition-colors">
            Contact
          </Link>
          <button
            type="button"
            className="flex items-center gap-1 hover:text-[#E50914] transition-colors"
          >
            <span>English</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* Main Split Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center relative z-20 px-4 sm:px-12 py-8">
        {/* Left Side: Cinematic Duotone Red Face */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative h-full max-w-xl">
          <div className="relative w-full max-w-md aspect-square rounded-full overflow-hidden border-4 border-[#E50914]/40 shadow-2xl shadow-red-950/40 bg-gradient-to-tr from-[#990000] to-[#E50914] p-1">
            <img
              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
              alt="Cinematic Portrait"
              className="w-full h-full object-cover object-center rounded-full filter contrast-125 brightness-90 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-[#E50914]/20 mix-blend-color" />
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md rounded-3xl bg-[#16171E] border border-white/5 p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight lowercase">
              login
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0E0F12] border border-white/10 focus:border-[#E50914] text-sm text-white placeholder-neutral-500 outline-hidden transition-all pr-10"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0E0F12] border border-white/10 focus:border-[#E50914] text-sm text-white placeholder-neutral-500 outline-hidden transition-all pr-10"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-black border-white/20 text-[#E50914] focus:ring-[#E50914]"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="text-neutral-400 hover:text-[#E50914] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-sm transition-all duration-300 shadow-lg shadow-red-900/40 cursor-pointer mt-2"
            >
              Login
            </button>
          </form>

          {/* Social Logins: Continue With */}
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#16171E] px-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wider absolute">
                Continue With
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="w-16 h-11 rounded-2xl bg-[#0E0F12] border border-white/10 hover:border-[#E50914] flex items-center justify-center text-sm font-black text-white hover:text-[#E50914] transition-colors shadow"
              >
                <span className="text-red-500 font-bold">G</span>
              </button>
              <button
                type="button"
                className="w-16 h-11 rounded-2xl bg-[#0E0F12] border border-white/10 hover:border-[#E50914] flex items-center justify-center text-sm font-black text-white hover:text-[#E50914] transition-colors shadow"
              >
                
              </button>
              <button
                type="button"
                className="w-16 h-11 rounded-2xl bg-[#0E0F12] border border-white/10 hover:border-[#E50914] flex items-center justify-center text-sm font-black text-white hover:text-[#E50914] transition-colors shadow"
              >
                <span className="text-blue-500 font-bold">f</span>
              </button>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-neutral-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#E50914] font-bold hover:underline"
              >
                Create Account!
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-30 pb-4 text-center text-xs text-neutral-600">
        © 2026 Tstream. All rights reserved.
      </div>
    </div>
  );
}
