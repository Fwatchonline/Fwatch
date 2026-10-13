import { useState } from 'react';
import {
  Headphones,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `TMOV-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#08090c] pt-24 pb-16">
      <SEO
        title="Contact Us - Tstream Support"
        description="Get in touch with the Tstream streaming team for support, feature inquiries, bug reports, and content requests."
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Contact Us', item: '/contact' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/60 text-[#E50914] border border-red-500/30 shadow-md shadow-red-950/30">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Contact Us
              </h1>
              <p className="text-xs text-neutral-400">
                Need help with playback, feature suggestions, or content requests? We're here for you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Support Team Online</span>
          </div>
        </div>

        {/* Success Banner */}
        {submittedTicket && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5 text-emerald-300 shadow-xl animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                Message Sent Successfully! Ticket #{submittedTicket}
              </h4>
              <p className="text-xs text-emerald-300/80 leading-relaxed">
                Thank you for contacting us. A confirmation has been logged and our support team will reply via email within 2-4 hours.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#12141a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Send a Message</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fill in the details below and our team will get back to you promptly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171922] border border-white/10 focus:border-[#E50914] focus:bg-[#1c1f2b] text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171922] border border-white/10 focus:border-[#E50914] focus:bg-[#1c1f2b] text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Topic / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171922] border border-white/10 focus:border-[#E50914] text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="technical">Playback / Streaming Issue</option>
                    <option value="content">Content Request (Movie/Series)</option>
                    <option value="bug">Report a Bug / Glitch</option>
                    <option value="subtitles">Subtitles / Audio Query</option>
                    <option value="partnership">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g. Inception 4K stream buffering"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171922] border border-white/10 focus:border-[#E50914] focus:bg-[#1c1f2b] text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Detailed Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide as much context as possible (device, browser, title name, error message)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171922] border border-white/10 focus:border-[#E50914] focus:bg-[#1c1f2b] text-sm text-white placeholder-neutral-500 outline-none transition-all resize-y shadow-inner"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>Your email is strictly protected and never shared.</span>
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold tracking-wide transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Contact Card */}
            <div className="p-6 rounded-3xl bg-[#12141a] border border-white/5 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">Direct Communication</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-red-950/60 text-[#E50914] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block font-medium">Customer Support Email</span>
                    <a
                      href="mailto:support@tstream.online"
                      className="text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors"
                    >
                      support@tstream.online
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block font-medium">Community Discord</span>
                    <a
                      href="https://discord.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-bold text-white hover:text-[#E50914] transition-colors"
                    >
                      discord.gg/tstream-community
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block font-medium">Average Response Time</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Under 2 Hours (24/7 Mon-Sun)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Health Card */}
            <div className="p-6 rounded-3xl bg-[#12141a] border border-white/5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#E50914]" />
                  <span>Playback Network Status</span>
                </h3>
                <span className="text-[11px] text-emerald-400 font-bold">100% Operational</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All 5 high-speed HLS edge servers (VidLink, VidUP, AutoEmbed, 2Embed, VidCloud) are active and streaming at full bandwidth with average 25ms latency.
              </p>
              <div className="pt-1">
                <Link
                  to="/help"
                  className="text-xs text-[#E50914] hover:underline font-bold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Check FAQ in Help Center &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
