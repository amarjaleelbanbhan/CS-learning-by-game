/**
 * University → canonical-concept mappings (PROMPT 04.6 Phase 8).
 *
 * The engine and the campaign do not change per university — only this mapping data
 * does. `confidence` is honest about provenance:
 *  - 'confirmed'                  — directly extracted from that university's own course
 *                                   material (this is Sukkur IBA, our original source).
 *  - 'public-syllabus'            — topic NAMES/sequencing confirmed via that
 *                                   university's own public syllabus page (no copyrighted
 *                                   lecture content read or copied — see `sourceUrls`).
 *  - 'inferred-standard-curriculum' — not individually verified; based on the fact that
 *                                   Pakistani HEC-accredited CS programs share a
 *                                   substantially standardized "Theory of Automata"
 *                                   course outline. Flagged explicitly so nobody mistakes
 *                                   this for a confirmed scrape of that university's docs.
 */
export type MappingConfidence = 'confirmed' | 'public-syllabus' | 'inferred-standard-curriculum';

export interface UniversitySyllabusMapping {
  readonly id: string;
  readonly universityName: string;
  readonly country: string;
  readonly courseLabel: string;
  readonly conceptIds: readonly string[];
  readonly confidence: MappingConfidence;
  readonly notes: string;
  readonly sourceUrls: readonly string[];
}

const CORE_V1_SEQUENCE: readonly string[] = [
  'mathematical-preliminaries',
  'languages-strings-alphabets',
  'language-set-operations',
  'dfa-fundamentals',
  'dfa-language-design',
  'nfa-fundamentals',
  'epsilon-transitions',
  'nfa-to-dfa-subset-construction',
  'regular-expressions',
  'grammars-general',
  'context-free-grammars',
  'pushdown-automata',
];

export const UNIVERSITY_MAPPINGS: readonly UniversitySyllabusMapping[] = [
  {
    id: 'sukkur-iba',
    universityName: 'Sukkur IBA University',
    country: 'Pakistan',
    courseLabel: 'Theory of Automata (BSCS)',
    conceptIds: [
      ...CORE_V1_SEQUENCE,
      'regex-automata-equivalence',
      'regular-language-properties',
      'regular-grammars',
      'cfg-ambiguity',
      'cfg-simplification',
      'chomsky-normal-form',
      'moore-mealy-machines',
    ],
    confidence: 'confirmed',
    notes:
      'This is the original ingestion source (PROMPT 04.5): real lecture decks, assignment, and exam material extracted directly from docs/Knowladge/. Moore/Mealy machines are confirmed taught here even though the universal V1 campaign defers that concept to Version 2.',
    sourceUrls: [],
  },
  {
    id: 'fast-nuces',
    universityName: 'FAST National University (NUCES)',
    country: 'Pakistan',
    courseLabel: 'Theory of Automata',
    conceptIds: [...CORE_V1_SEQUENCE, 'regular-language-properties', 'regular-grammars'],
    confidence: 'inferred-standard-curriculum',
    notes:
      'Not individually verified against a scraped syllabus. Pakistani HEC-accredited CS programs share a substantially standardized Theory of Automata outline; this entry reflects that shared baseline, deliberately omitting the deepest CFG topics (ambiguity/CNF) which vary more by instructor.',
    sourceUrls: [],
  },
  {
    id: 'nust',
    universityName: 'National University of Sciences & Technology (NUST)',
    country: 'Pakistan',
    courseLabel: 'Theory of Automata',
    conceptIds: [...CORE_V1_SEQUENCE, 'regular-language-properties', 'regular-grammars'],
    confidence: 'inferred-standard-curriculum',
    notes: 'Same standardized-baseline caveat as fast-nuces.',
    sourceUrls: [],
  },
  {
    id: 'comsats',
    universityName: 'COMSATS University Islamabad',
    country: 'Pakistan',
    courseLabel: 'Theory of Automata',
    conceptIds: [...CORE_V1_SEQUENCE, 'regular-language-properties'],
    confidence: 'inferred-standard-curriculum',
    notes: 'Same standardized-baseline caveat as fast-nuces.',
    sourceUrls: [],
  },
  {
    id: 'uet',
    universityName: 'University of Engineering and Technology (UET)',
    country: 'Pakistan',
    courseLabel: 'Theory of Automata',
    conceptIds: [...CORE_V1_SEQUENCE, 'regular-language-properties'],
    confidence: 'inferred-standard-curriculum',
    notes: 'Same standardized-baseline caveat as fast-nuces.',
    sourceUrls: [],
  },
  {
    id: 'mit',
    universityName: 'Massachusetts Institute of Technology',
    country: 'USA',
    courseLabel: '18.404J / 6.045J — Automata, Computability, and Complexity',
    conceptIds: [
      'languages-strings-alphabets',
      'dfa-fundamentals',
      'nfa-fundamentals',
      'regular-expressions',
      'regular-language-properties',
      'context-free-grammars',
      'pushdown-automata',
      'turing-machines',
      'decidability',
      'recursively-enumerable-languages',
      'complexity-theory-basics',
    ],
    confidence: 'public-syllabus',
    notes:
      "Topic names and sequencing (automata/languages → computability → complexity theory) confirmed from MIT OpenCourseWare's own public syllabus page. No lecture content was read or copied.",
    sourceUrls: [
      'https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/pages/syllabus/',
      'https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/pages/syllabus/',
    ],
  },
  {
    id: 'stanford',
    universityName: 'Stanford University',
    country: 'USA',
    courseLabel: 'CS154 — Introduction to the Theory of Computation',
    conceptIds: [
      'dfa-fundamentals',
      'nfa-fundamentals',
      'regular-language-properties',
      'myhill-nerode-theorem',
      'dfa-minimization',
      'turing-machines',
      'decidability',
      'rices-theorem',
      'complexity-theory-basics',
    ],
    confidence: 'public-syllabus',
    notes:
      "Confirmed DFA minimization and the Myhill–Nerode theorem as explicit topics via Stanford's own course pages — this directly motivated adding `dfa-minimization` as a V1 concept and `myhill-nerode-theorem` as a flagged V2 concept in this pass.",
    sourceUrls: [
      'https://cs154.stanford.edu/',
      'https://explorecourses.stanford.edu/search?q=CS154',
    ],
  },
  {
    id: 'nptel-toc',
    universityName: 'NPTEL (IIT, India)',
    country: 'India',
    courseLabel: 'Theory of Computation',
    conceptIds: [
      'languages-strings-alphabets',
      'dfa-fundamentals',
      'nfa-fundamentals',
      'context-free-grammars',
      'pushdown-automata',
      'turing-machines',
      'decidability',
      'rices-theorem',
      'recursively-enumerable-languages',
      'regular-language-properties',
    ],
    confidence: 'public-syllabus',
    notes:
      "Topic names and week-by-week sequencing confirmed from NPTEL's own public course/syllabus pages. No lecture content was read or copied.",
    sourceUrls: [
      'https://archive.nptel.ac.in/content/syllabus_pdf/106104028.pdf',
      'https://nptel.ac.in/courses/106104028',
    ],
  },
];

export function mappingById(id: string): UniversitySyllabusMapping | undefined {
  return UNIVERSITY_MAPPINGS.find((m) => m.id === id);
}

/** Which university ids include this concept in their mapping — a quick "is this concept universal?" check. */
export function universitiesCoveringConcept(conceptId: string): readonly string[] {
  return UNIVERSITY_MAPPINGS.filter((m) => m.conceptIds.includes(conceptId)).map((m) => m.id);
}
