import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const S = {
  bg: '#0A0F1E',
  surface: '#111827',
  border: '#1E2A3A',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
  goldBright: '#E8C060',
  green: '#00E676',
  greenDim: '#0A2A1A',
  greenBorder: '#00C853',
};

const HABIT_PACKS = [
  {
    id: 'professional',
    label: 'Professional',
    icon: '💼',
    desc: 'For career-focused individuals',
    habits: ['No work chitchat', '30min learning', 'Sleep early', 'No meetings before 10am'],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: '🏋️',
    desc: 'For health and performance',
    habits: ['30min workout', 'Drink 2L water', '8hrs sleep', '10k steps'],
  },
  {
    id: 'student',
    label: 'Student',
    icon: '📚',
    desc: 'For focused study and growth',
    habits: ['2hr study block', 'Review notes', 'No phone before noon', 'Read 20 pages'],
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '✏️',
    desc: 'Build your own from scratch',
    habits: [],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState(null);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePackSelect = (pack) => {
    setSelectedPack(pack);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (selectedPack && selectedPack.habits.length > 0) {
        for (const habitName of selectedPack.habits) {
          try {
            await api.post('/habits', { name: habitName, category: 'Personal', point_value: 1 });
          } catch (e) {
            // continue even if one fails
          }
        }
      }
      if (goal.trim()) {
        try {
          await api.post('/monthly-goals', { goal_text: goal.trim() });
        } catch (e) {
          // silent fail
        }
      }
      await api.post('/users/complete-onboarding');
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false);
      navigate('/dashboard');
    }
  };

  const totalSteps = 3;

  return (
    <div style={{ backgroundColor: S.bg, minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <img src="/logo.png" alt="Habit King" className="h-16 w-auto mb-10" />

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                height: '3px',
                flex: 1,
                marginRight: i < totalSteps - 1 ? '6px' : '0',
                backgroundColor: i < step ? S.gold : S.border,
                borderRadius: '2px',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
        <p style={{ color: S.muted }} className="text-xs text-right">
          Step {step} of {totalSteps}
        </p>
      </div>

      {/* Card */}
      <div
        style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}
        className="w-full max-w-md rounded-2xl p-8"
      >
        {/* STEP 1 — Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-5xl mb-4">👑</div>
            <h1 style={{ color: S.text }} className="text-2xl font-black mb-2 tracking-tight">
              Welcome to Habit King
            </h1>
            <p style={{ color: S.muted }} className="text-sm mb-8 leading-relaxed">
              You're about to join a competitive habit tracking community. Build discipline, climb the leaderboard, and become the Habit King.
            </p>
            <div className="space-y-3 text-left mb-8">
              {[
                { icon: '✅', text: 'Track daily habits on a monthly grid' },
                { icon: '🏆', text: 'Compete on the leaderboard with your group' },
                { icon: '🔥', text: 'Build streaks and earn bonus points' },
                { icon: '👥', text: 'Challenge friends and see their progress' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span style={{ color: S.muted }} className="text-sm">{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{ backgroundColor: S.gold, color: S.bg }}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide hover:opacity-90 transition"
            >
              Let's Go →
            </button>
          </div>
        )}

        {/* STEP 2 — Pick a habit pack */}
        {step === 2 && (
          <div>
            <h2 style={{ color: S.text }} className="text-xl font-black mb-1 tracking-tight">
              Pick your habit pack
            </h2>
            <p style={{ color: S.muted }} className="text-sm mb-6">
              Choose a starter pack or build your own. You can always change habits later.
            </p>
            <div className="space-y-3 mb-8">
              {HABIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handlePackSelect(pack)}
                  style={{
                    backgroundColor: selectedPack?.id === pack.id ? '#1A2400' : S.bg,
                    border: `1px solid ${selectedPack?.id === pack.id ? S.gold : S.border}`,
                    color: S.text,
                  }}
                  className="w-full p-4 rounded-xl text-left transition hover:border-yellow-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pack.icon}</span>
                      <div>
                        <p style={{ color: S.text }} className="text-sm font-bold">{pack.label}</p>
                        <p style={{ color: S.muted }} className="text-xs">{pack.desc}</p>
                      </div>
                    </div>
                    {selectedPack?.id === pack.id && (
                      <span style={{ color: S.gold }} className="text-lg">✓</span>
                    )}
                  </div>
                  {selectedPack?.id === pack.id && pack.habits.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pack.habits.map((h) => (
                        <span
                          key={h}
                          style={{ backgroundColor: S.border, color: S.muted }}
                          className="text-xs px-2 py-1 rounded-lg"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                className="flex-1 py-3 rounded-xl font-bold text-sm hover:border-yellow-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPack}
                style={{
                  backgroundColor: selectedPack ? S.gold : S.border,
                  color: selectedPack ? S.bg : S.muted,
                }}
                className="flex-1 py-3 rounded-xl font-black text-sm transition"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Set first goal + finish */}
        {step === 3 && (
          <div>
            <h2 style={{ color: S.text }} className="text-xl font-black mb-1 tracking-tight">
              Set your first goal
            </h2>
            <p style={{ color: S.muted }} className="text-sm mb-6">
              What's one thing you want to achieve this month? This becomes your first monthly goal.
            </p>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Complete 80% of my habits this month"
              maxLength={200}
              style={{
                backgroundColor: S.bg,
                border: `1px solid ${S.border}`,
                color: S.text,
              }}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-yellow-600 transition mb-6"
            />
            <div
              style={{ backgroundColor: S.greenDim, border: `1px solid ${S.greenBorder}` }}
              className="rounded-xl p-4 mb-8"
            >
              <p style={{ color: S.green }} className="text-xs font-bold uppercase tracking-widest mb-1">
                You're all set 🎉
              </p>
              <p style={{ color: S.muted }} className="text-xs leading-relaxed">
                Your habits are ready. Join or create a group to compete on the leaderboard. Invite your friends to make it competitive.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                style={{ backgroundColor: 'transparent', border: `1px solid ${S.border}`, color: S.muted }}
                className="flex-1 py-3 rounded-xl font-bold text-sm hover:border-yellow-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                style={{ backgroundColor: S.gold, color: S.bg }}
                className="flex-1 py-3 rounded-xl font-black text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Go to Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip */}
      {step > 1 && (
        <button
          onClick={handleFinish}
          style={{ color: S.muted }}
          className="mt-6 text-xs hover:text-yellow-500 transition"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}