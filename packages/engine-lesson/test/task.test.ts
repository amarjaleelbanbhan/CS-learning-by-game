import { describe, expect, it } from 'vitest';
import {
  isGraded,
  referencedGraderIds,
  taskXp,
  TASK_VERBS,
  validateLesson,
  validateTask,
  VERB_XP_MULTIPLIER,
  type Lesson,
  type Task,
} from '../src/index.js';

function construct(overrides: Partial<Task> = {}): Task {
  return {
    id: 'build',
    verb: 'construct',
    prompt: 'Build a DFA accepting strings that end in 01.',
    graderId: 'dfa-equivalence',
    widgetId: 'dfa-builder',
    specRef: 'ends-in-01',
    baseXp: 100,
    ...overrides,
  };
}

describe('task verbs', () => {
  it('assigns every verb an XP multiplier', () => {
    for (const verb of TASK_VERBS) {
      expect(VERB_XP_MULTIPLIER[verb], verb).toBeTypeOf('number');
    }
  });

  it('pays nothing for passive verbs', () => {
    expect(VERB_XP_MULTIPLIER.observe).toBe(0);
    expect(VERB_XP_MULTIPLIER.experiment).toBe(0);
  });

  it('pays more for higher agency', () => {
    expect(VERB_XP_MULTIPLIER.predict).toBeLessThan(VERB_XP_MULTIPLIER.construct);
    expect(VERB_XP_MULTIPLIER.construct).toBeLessThan(VERB_XP_MULTIPLIER.boss);
  });

  it('classifies graded vs ungraded verbs', () => {
    expect(isGraded(construct())).toBe(true);
    expect(isGraded({ ...construct(), verb: 'observe', graderId: undefined, baseXp: 0 })).toBe(
      false,
    );
  });
});

describe('taskXp', () => {
  it('applies the verb multiplier', () => {
    expect(taskXp(construct({ baseXp: 100 }))).toBe(100);
    expect(taskXp(construct({ verb: 'predict', baseXp: 100 }))).toBe(60);
    expect(taskXp(construct({ verb: 'boss', baseXp: 100 }))).toBe(150);
  });

  it('charges for hints', () => {
    expect(taskXp(construct({ baseXp: 100 }), 1)).toBe(80);
    expect(taskXp(construct({ baseXp: 100 }), 2)).toBe(60);
  });

  it('floors the hint penalty so asking for help never beats quitting', () => {
    expect(taskXp(construct({ baseXp: 100 }), 99)).toBe(40);
  });

  it('never pays for an ungraded verb regardless of baseXp', () => {
    expect(taskXp({ ...construct(), verb: 'observe', baseXp: 500 })).toBe(0);
  });
});

describe('validateTask', () => {
  it('accepts a well-formed graded task', () => {
    expect(validateTask(construct(), 'stage')).toEqual([]);
  });

  it('requires a grader for a graded verb', () => {
    const errors = validateTask(construct({ graderId: undefined }), 'stage');
    expect(errors.join(' ')).toMatch(/graderId is required/);
  });

  it('requires a widget to collect the answer', () => {
    const errors = validateTask(construct({ widgetId: undefined }), 'stage');
    expect(errors.join(' ')).toMatch(/needs a widgetId/);
  });

  it('forbids an ungraded verb from naming a grader', () => {
    const errors = validateTask({ ...construct(), verb: 'observe', baseXp: 0 }, 'stage');
    expect(errors.join(' ')).toMatch(/must not name a grader/);
  });

  it('forbids an ungraded verb from awarding XP', () => {
    // This is the rule that stops "watch an animation, collect 250 XP" reappearing.
    const errors = validateTask(
      { ...construct(), verb: 'observe', graderId: undefined, widgetId: undefined, baseXp: 250 },
      'stage',
    );
    expect(errors.join(' ')).toMatch(/cannot award XP/);
  });

  it('rejects empty ids, prompts and negative XP', () => {
    expect(validateTask(construct({ id: ' ' }), 'x').join(' ')).toMatch(/id must not be empty/);
    expect(validateTask(construct({ prompt: '' }), 'x').join(' ')).toMatch(
      /prompt must not be empty/,
    );
    expect(validateTask(construct({ baseXp: -1 }), 'x').join(' ')).toMatch(/non-negative/);
  });

  it('rejects an unknown verb', () => {
    const errors = validateTask({ ...construct(), verb: 'vibe' as never }, 'x');
    expect(errors.join(' ')).toMatch(/unknown verb/);
  });
});

describe('referencedGraderIds', () => {
  it('dedupes and sorts, skipping ungraded tasks', () => {
    const ids = referencedGraderIds([
      construct({ id: 'a', graderId: 'dfa-equivalence' }),
      construct({ id: 'b', graderId: 'choice' }),
      construct({ id: 'c', graderId: 'dfa-equivalence' }),
      { ...construct({ id: 'd' }), verb: 'observe', graderId: undefined, baseXp: 0 },
    ]);
    expect(ids).toEqual(['choice', 'dfa-equivalence']);
  });
});

describe('lesson validation with tasks', () => {
  function lessonWith(stageOverrides: Partial<Lesson['stages'][number]>): Lesson {
    return {
      id: 'l1',
      version: 1,
      missionId: 'm1',
      conceptId: 'c1',
      title: 'T',
      stages: [
        {
          id: 's1',
          kind: 'challenge',
          title: 'Do it',
          blocks: [{ kind: 'prose', text: 'go' }],
          ...stageOverrides,
        },
      ],
    };
  }

  it('accepts a gated stage carrying a graded task', () => {
    expect(validateLesson(lessonWith({ requiresCompletion: true, tasks: [construct()] }))).toEqual(
      [],
    );
  });

  it('rejects a gated stage whose tasks are all passive', () => {
    // The NFA→DFA lab shipped exactly this shape and paid 250 XP for watching.
    const errors = validateLesson(
      lessonWith({
        requiresCompletion: true,
        tasks: [
          { ...construct(), verb: 'observe', graderId: undefined, widgetId: undefined, baseXp: 0 },
        ],
      }),
    );
    expect(errors.join(' ')).toMatch(/passive stages cannot gate progress/);
  });

  it('catches duplicate task ids within a stage', () => {
    const errors = validateLesson(lessonWith({ tasks: [construct(), construct()] }));
    expect(errors.join(' ')).toMatch(/duplicate task id/);
  });

  it('surfaces task errors through the lesson validator', () => {
    const errors = validateLesson(lessonWith({ tasks: [construct({ graderId: undefined })] }));
    expect(errors.join(' ')).toMatch(/graderId is required/);
  });

  it('leaves task-free lessons valid', () => {
    expect(validateLesson(lessonWith({}))).toEqual([]);
  });
});
