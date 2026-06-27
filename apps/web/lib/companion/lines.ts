/**
 * Companion script bank. Keys are generic game-engine events (not specific to
 * Theory of Automata) so this stays reusable when future subject plugins land —
 * a plugin may later contribute extra lines, but the core events stay the same.
 */
export type CompanionEvent =
  | 'welcome'
  | 'idle'
  | 'mission-complete'
  | 'flagship-complete'
  | 'level-up'
  | 'streak'
  | 'accept'
  | 'reject';

const BANK: Record<CompanionEvent, string[]> = {
  welcome: [
    "Reactor's online. I'm ARIA — I'll be running point on your training.",
    "Good, you're here. Laboratory systems are green. Let's build something that thinks.",
  ],
  idle: [
    'Take your time. Every great engineer starts by staring at a blank canvas.',
    "Need a hint? I'm listening.",
    'Fun fact: a DFA never second-guesses itself. One state, one decision.',
    "Curious is good. Curious is how you'll actually understand this.",
  ],
  'mission-complete': [
    'Clean run. That machine is exactly as smart as you built it to be.',
    "Nice work, Recruit. You're starting to think like a machine.",
    "That's a wrap. Your understanding just leveled up, not just your XP.",
  ],
  'flagship-complete': [
    'You just watched nondeterminism collapse into certainty. Not everyone gets to see that.',
    'Subset construction, mastered. That algorithm runs half the compilers on Earth.',
  ],
  'level-up': [
    "Power surge detected — that's you, leveling up.",
    'New level. New laboratory access. Keep going.',
  ],
  streak: ["Consistency is the real superpower here. Don't break the chain."],
  accept: ['Accepted. The machine found its way home.'],
  reject: ["Rejected — and that's data, not failure. Try tracing why."],
};

export function pickLine(event: CompanionEvent, seed = Math.random()): string {
  const lines = BANK[event];
  return lines[Math.floor(seed * lines.length) % lines.length]!;
}
