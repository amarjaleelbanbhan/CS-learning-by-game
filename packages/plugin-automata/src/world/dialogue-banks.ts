import type { DialogueLine } from '@arc/engine-world';

/**
 * Dialogue banks, keyed by NPC id. Each NPC has a generic baseline plus increasingly
 * specific lines gated by rank and/or relationship — selectDialogueLine (engine-world)
 * always shows the most specific eligible line, so dialogue evolves automatically as the
 * player's rank and relationship with the NPC grow. World-event lines surface only while
 * that event is active.
 */
export const DIALOGUE_BANKS: Readonly<Record<string, readonly DialogueLine[]>> = {
  'security-chief': [
    { id: 'sc-welcome', text: 'Welcome to the Academy, Cadet. Keep the perimeter clean.' },
    {
      id: 'sc-acquaintance',
      text: "You're getting the hang of this. Don't get cocky around the edge cases.",
      minRelationshipScore: 10,
    },
    {
      id: 'sc-chief-respect',
      text: "We've been waiting for your expertise, Engineer.",
      minRankOrder: 6,
    },
    {
      id: 'sc-incident',
      text: 'We have a Security Incident in progress — every automaton you can field helps.',
      worldEventId: 'security-incident',
    },
  ],
  'lab-assistant': [
    { id: 'orbit-welcome', text: "Lab systems online. I'm ORBIT — I keep this place running." },
    {
      id: 'orbit-frequent',
      text: "You're in here often. I've started pre-warming the builder canvas for you.",
      minRelationshipScore: 30,
    },
    {
      id: 'orbit-hero',
      text: "Chief Engineer's lab, my favorite shift. Everything's exactly where you left it.",
      minRelationshipScore: 150,
    },
  ],
  'maintenance-drone': [
    { id: 'drone-beep', text: '*chirps and continues polishing a console*' },
    { id: 'drone-acknowledge', text: '*beeps in recognition as you pass*', minRelationshipScore: 10 },
  ],
  'professor-kleene': [
    {
      id: 'kleene-welcome',
      text: 'Ah, a new mind for nondeterminism. Try not to assume every branch must agree.',
    },
    {
      id: 'kleene-trusted',
      text: "Your branching intuition has sharpened. I've noticed.",
      minRelationshipScore: 75,
    },
    {
      id: 'kleene-reactor-failure',
      text: 'The Quantum Reactor is unstable again — every branch counts double right now.',
      worldEventId: 'quantum-reactor-failure',
    },
  ],
  'quantum-scientist': [
    { id: 'voss-welcome', text: "Dr. Voss. I've seen your traces — promising branching discipline." },
    {
      id: 'voss-hero',
      text: 'The department speaks of you, Engineer. Quantum work suits you.',
      minRelationshipScore: 150,
    },
  ],
  'professor-turing': [
    {
      id: 'turing-welcome',
      text: "Subset construction isn't taught here. It's earned. Welcome to that earning.",
    },
    {
      id: 'turing-respect',
      text: "We've been waiting for your expertise, Engineer. The archive remembers every engineer who passed through.",
      minRankOrder: 6,
    },
    {
      id: 'turing-festival',
      text: 'The Research Festival is in full swing — the archive has never been busier.',
      worldEventId: 'research-festival',
    },
  ],
  'grammar-archivist': [
    {
      id: 'archivist-welcome',
      text: 'Few reach the Tower this early. The grammars here are older than the Academy itself.',
    },
    {
      id: 'archivist-competition',
      text: 'The Grammar Competition is underway — derivations are flying through the stacks.',
      worldEventId: 'grammar-competition',
    },
  ],
  'compiler-engineer': [
    {
      id: 'osei-welcome',
      text: "Chief Engineer Osei. The Reactor doesn't forgive sloppy stacks — glad you're finally here.",
    },
    {
      id: 'osei-crisis',
      text: "Compiler Crisis — half the stack's misbehaving. Good timing, or bad, depending how you look at it.",
      worldEventId: 'compiler-crisis',
    },
  ],
};

export function dialogueFor(npcId: string): readonly DialogueLine[] {
  return DIALOGUE_BANKS[npcId] ?? [];
}
