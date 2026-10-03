import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  serverId: string;
}

export function ReportModal({ isOpen, onClose, title, serverId }: ReportModalProps) {
  const [issueType, setIssueType] = useState('buffering');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#101217] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Thank You for Reporting!</h3>
            <p className="text-xs text-neutral-400">
              Our automated streaming diagnostics have received your report for {serverId}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F5C518]/15 text-[#F5C518] border border-[#F5C518]/25">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Report Playback Issue</h3>
                <p className="text-xs text-neutral-400 truncate max-w-[280px]">{title}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-[#151820] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#F5C518]"
              >
                <option value="buffering">Frequent Buffering / Stutter</option>
                <option value="black_screen">Black Screen / Video Not Loading</option>
                <option value="audio_sync">Audio Out of Sync</option>
                <option value="subtitles">Subtitles Missing or Incorrect</option>
                <option value="server_down">Server Down / Network Timeout</option>
                <option value="wrong_episode">Wrong Episode or Title</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Additional Details (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g. Video stopped playing at 12:45..."
                className="w-full bg-[#151820] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F5C518]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#F5C518] hover:bg-[#E5B508] text-black text-xs font-extrabold rounded-lg shadow-md shadow-[#F5C518]/25 cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
