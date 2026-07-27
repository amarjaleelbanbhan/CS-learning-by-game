import { describe, expect, it } from 'vitest';
import {
  STAGE_FLOW,
  advance,
  canAdvance,
  completeStage,
  completionRatio,
  initProgress,
  isLessonComplete,
  isProgressStale,
  isStageUnlocked,
  goBack,
  jumpTo,
  lessonWidgetIds,
  validateContentBlock,
  validateLesson,
  validateLessonWidgets,
  type ContentBlock,
  type Lesson,
} from '../src/index.js';

function lesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'toa.demo',
    version: 1,
    missionId: 'toa.demo-mission',
    conceptId: 'demo-concept',
    title: 'Demo Lesson',
    stages: [
      { id: 's1', kind: 'mission-brief', title: 'Brief', blocks: [{ kind: 'prose', text: 'Hi' }] },
      {
        id: 's2',
        kind: 'challenge',
        title: 'Solve it',
        requiresCompletion: true,
        blocks: [{ kind: 'widget', widgetId: 'dfa-builder', alt: 'DFA construction canvas' }],
      },
      { id: 's3', kind: 'summary', title: 'Recap', blocks: [{ kind: 'prose', text: 'Done' }] },
    ],
    ...overrides,
  };
}

describe('validateLesson', () => {
  it('accepts a well-formed lesson', () => {
    expect(validateLesson(lesson())).toEqual([]);
  });

  it('rejects empty required fields', () => {
    const errors = validateLesson(lesson({ id: '', title: '  ', missionId: '' }));
    expect(errors.some((e) => e.includes('lesson id'))).toBe(true);
    expect(errors.some((e) => e.includes('title'))).toBe(true);
    expect(errors.some((e) => e.includes('missionId'))).toBe(true);
  });

  it('rejects a lesson with no stages', () => {
    expect(validateLesson(lesson({ stages: [] }))).toContain(
      'lesson "toa.demo": must have at least one stage',
    );
  });

  it('rejects duplicate stage ids', () => {
    const l = lesson({
      stages: [
        { id: 'dup', kind: 'story', title: 'A', blocks: [{ kind: 'prose', text: 'a' }] },
        { id: 'dup', kind: 'summary', title: 'B', blocks: [{ kind: 'prose', text: 'b' }] },
      ],
    });
    expect(validateLesson(l).some((e) => e.includes('duplicate stage id'))).toBe(true);
  });

  it('rejects stages that violate the FR-LESSON-1 flow order', () => {
    const l = lesson({
      stages: [
        { id: 'a', kind: 'summary', title: 'Recap', blocks: [{ kind: 'prose', text: 'x' }] },
        { id: 'b', kind: 'intuition', title: 'Idea', blocks: [{ kind: 'prose', text: 'y' }] },
      ],
    });
    expect(validateLesson(l).some((e) => e.includes('out of FR-LESSON-1 flow order'))).toBe(true);
  });

  it('rejects a stage with no content blocks', () => {
    const l = lesson({
      stages: [{ id: 'empty', kind: 'story', title: 'Nothing', blocks: [] }],
    });
    expect(validateLesson(l).some((e) => e.includes('at least one content block'))).toBe(true);
  });

  it('rejects a positive-integer version violation', () => {
    expect(validateLesson(lesson({ version: 0 })).some((e) => e.includes('version'))).toBe(true);
  });
});

describe('validateContentBlock', () => {
  it('requires alt text on widgets so an unlabelled canvas cannot ship', () => {
    const block: ContentBlock = { kind: 'widget', widgetId: 'x', alt: '' };
    expect(validateContentBlock(block, 'w').some((e) => e.includes('alt text'))).toBe(true);
  });

  it('rejects an unknown callout tone', () => {
    const block = { kind: 'callout', tone: 'chartreuse', text: 'hi' } as unknown as ContentBlock;
    expect(validateContentBlock(block, 'c').some((e) => e.includes('unknown callout tone'))).toBe(
      true,
    );
  });

  it('rejects empty prose, math and list items', () => {
    expect(validateContentBlock({ kind: 'prose', text: '  ' }, 'p')).toHaveLength(1);
    expect(validateContentBlock({ kind: 'math', latex: '', alt: 'spoken' }, 'm')).toHaveLength(1);
    expect(validateContentBlock({ kind: 'list', items: [] }, 'l')).toHaveLength(1);
  });

  it('rejects a formula with no spoken form', () => {
    // Raw LaTeX read aloud is gibberish, so alt is required rather than advisory.
    expect(validateContentBlock({ kind: 'math', latex: '\\delta', alt: ' ' }, 'm')).toHaveLength(1);
  });

  it('accepts valid blocks of every kind', () => {
    const blocks: ContentBlock[] = [
      { kind: 'prose', text: 'ok' },
      { kind: 'callout', tone: 'warning', text: 'careful' },
      { kind: 'math', latex: 'q_0', alt: 'q sub zero', display: true },
      { kind: 'list', ordered: true, items: ['one'] },
      { kind: 'widget', widgetId: 'w', alt: 'described' },
    ];
    for (const b of blocks) expect(validateContentBlock(b, 'x')).toEqual([]);
  });
});

describe('widget references', () => {
  it('collects referenced widget ids, deduped', () => {
    expect(lessonWidgetIds(lesson())).toEqual(['dfa-builder']);
  });

  it('flags widgets missing from the host registry', () => {
    expect(validateLessonWidgets(lesson(), [])).toEqual([
      'lesson "toa.demo": references unregistered widget "dfa-builder"',
    ]);
    expect(validateLessonWidgets(lesson(), ['dfa-builder'])).toEqual([]);
  });
});

describe('stage gating (FR-LESSON-3)', () => {
  const l = lesson();

  it('starts on the first stage with nothing completed', () => {
    const p = initProgress(l);
    expect(p.currentIndex).toBe(0);
    expect(p.completedStageIds).toEqual([]);
  });

  it('locks stages behind an uncompleted gated stage', () => {
    const p = initProgress(l);
    expect(isStageUnlocked(l, p, 0)).toBe(true);
    expect(isStageUnlocked(l, p, 1)).toBe(true); // s1 is not gated
    expect(isStageUnlocked(l, p, 2)).toBe(false); // s2 is gated and unfinished
  });

  it('unlocks the next stage once the gate is satisfied', () => {
    const p = completeStage(initProgress(l), 's2');
    expect(isStageUnlocked(l, p, 2)).toBe(true);
  });

  it('refuses to advance past a gated stage until it is completed', () => {
    let p = initProgress(l);
    p = advance(l, p); // s1 -> s2 (s1 ungated)
    expect(p.currentIndex).toBe(1);
    expect(canAdvance(l, p)).toBe(false);
    expect(advance(l, p)).toBe(p); // unchanged reference — genuinely a no-op

    p = completeStage(p, 's2');
    expect(canAdvance(l, p)).toBe(true);
    expect(advance(l, p).currentIndex).toBe(2);
  });

  it('implicitly completes read-only stages when advancing past them', () => {
    const p = advance(l, initProgress(l));
    expect(p.completedStageIds).toContain('s1');
  });

  it('never advances past the last stage', () => {
    let p = initProgress(l);
    p = advance(l, p);
    p = completeStage(p, 's2');
    p = advance(l, p);
    expect(p.currentIndex).toBe(2);
    expect(canAdvance(l, p)).toBe(false);
  });

  it('goes back without un-completing anything', () => {
    let p = advance(l, initProgress(l));
    p = goBack(p);
    expect(p.currentIndex).toBe(0);
    expect(p.completedStageIds).toContain('s1');
    expect(goBack(p)).toBe(p); // already at the start
  });

  it('jumps only to unlocked stages', () => {
    const p = initProgress(l);
    expect(jumpTo(l, p, 2)).toBe(p); // locked
    expect(jumpTo(l, p, 1).currentIndex).toBe(1);
    expect(jumpTo(l, p, 99)).toBe(p); // out of range
  });

  it('reports completion only when every gated stage is done', () => {
    const p = initProgress(l);
    expect(isLessonComplete(l, p)).toBe(false);
    expect(isLessonComplete(l, completeStage(p, 's2'))).toBe(true);
  });

  it('reports completion ratio over gated stages, and 1 when nothing is gated', () => {
    const p = initProgress(l);
    expect(completionRatio(l, p)).toBe(0);
    expect(completionRatio(l, completeStage(p, 's2'))).toBe(1);

    const ungated = lesson({
      stages: [{ id: 'only', kind: 'story', title: 'S', blocks: [{ kind: 'prose', text: 'x' }] }],
    });
    expect(completionRatio(ungated, initProgress(ungated))).toBe(1);
  });

  it('completeStage is idempotent', () => {
    const once = completeStage(initProgress(l), 's2');
    expect(completeStage(once, 's2')).toBe(once);
  });

  it('detects stale progress after a content version bump', () => {
    const p = initProgress(l);
    expect(isProgressStale(l, p)).toBe(false);
    expect(isProgressStale({ ...l, version: 2 }, p)).toBe(true);
  });
});

describe('STAGE_FLOW', () => {
  it('matches the FR-LESSON-1 sequence exactly', () => {
    expect(STAGE_FLOW).toEqual([
      'mission-brief',
      'story',
      'intuition',
      'visualization',
      'animation',
      'simulation',
      'sandbox',
      'guided-practice',
      'challenge',
      'boss-battle',
      'summary',
      'memory-tricks',
      'common-mistakes',
      'revision',
      'unlock-reward',
    ]);
  });
});
