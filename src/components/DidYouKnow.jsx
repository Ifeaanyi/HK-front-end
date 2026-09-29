import { useState, useEffect } from 'react';

const S = {
  surface: '#111827',
  border: '#1E2A3A',
  text: '#F5F0E8',
  gold: '#C9A84C',
  dim: '#3A4A5A',
};

// Each tip: {g}...{/g} marks the gold-highlighted part(s)
const TIPS = [
  'A {g}14-day streak{/g} earns +5 bonus points. Push to {g}30 days{/g} for a massive +20.',
  'Complete all {g}5 monthly goals{/g} and grab a +15 point bonus.',
  'Hit {g}85% to-do productivity{/g} for +20 bonus points — even 50% earns you +5.',
  'To win the crown: {g}65% productivity{/g}, 3 or fewer missed days, and {g}90+ activities{/g}.',
  'Your daily sheet locks at {g}11:59 PM{/g} your time. Log before then.',
  'Keep your streak: complete {g}all Team habits{/g}, 1 Personal habit, and 1 To-Do each day.',
  'Study hours count too — {g}1 hour logged = 1 point{/g}.',
  'You can edit your monthly goals from the {g}1st to the 8th{/g}. After that, they lock.',
  "Team habits are your {g}group's shared habits{/g} — everyone in the group tracks them daily. Complete them all to keep your streak alive.",
  'Personal habits are your own custom ones — add up to {g}10{/g} things you want to build in your life.',
  'Study hours track time spent {g}learning a skill{/g} — a course, reading, practice. Not your day job. Every hour = 1 point.',
  '"Activities" means your {g}to-do items{/g}. To win the crown, you need {g}90+ to-dos{/g} logged in a month.',
  'The Hall of Fame is your trophy room — every {g}past champion{/g} and all-time record lives there.',
  'Pro members can be in up to {g}2 groups{/g} — compete with different circles of friends.',
  'Create your own group, invite your friends, and compete on your own leaderboard.',
];

function renderTip(tip) {
  const parts = tip.split(/(\{g\}.*?\{\/g\})/g);
  return parts.map((part, i) => {
    if (part.startsWith('{g}')) {
      const inner = part.replace('{g}', '').replace('{/g}', '');
      return <span key={i} style={{ color: S.gold }}>{inner}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DidYouKnow() {
  const today = new Date().toISOString().split('T')[0];
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('tipDismissedDate') === today
  );
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    // Start on a rotating tip so it's not always the same one on open
    const start = parseInt(localStorage.getItem('tipIndex') || '-1', 10);
    setIndex((start + 1) % TIPS.length);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      // fade out, switch, fade in
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => {
          const next = (prev + 1) % TIPS.length;
          localStorage.setItem('tipIndex', String(next));
          return next;
        });
        setFade(true);
      }, 300);
    }, 8000); // cycle every 8 seconds
    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-6 relative max-w-2xl mx-auto">
        <button onClick={() => { setDismissed(true); localStorage.setItem('tipDismissedDate', today); }}
          style={{ position: 'absolute', top: 16, right: 18, color: S.dim, fontSize: 18, lineHeight: 1, background: 'transparent', border: 'none' }}>
          ×
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: S.gold }}></div>
          <span style={{ color: S.gold, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }} className="uppercase">Did You Know</span>
        </div>

        <div style={{ color: S.text, fontSize: 16, lineHeight: 1.5, fontWeight: 500, minHeight: 48, opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          {renderTip(TIPS[index])}
        </div>

        <div className="flex gap-1.5 mt-4">
          {TIPS.map((_, i) => (
            <div key={i} style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: i === index ? S.gold : S.border, transition: 'background-color 0.3s ease' }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}