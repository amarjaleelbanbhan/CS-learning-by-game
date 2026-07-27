import { describe, expect, it } from 'vitest';
import { validateLesson, validateLessonWidgets } from '@arc/engine-lesson';
import { LESSONS, MISSIONS, lessonForMission } from '@arc/plugin-automata';
import { WIDGET_REGISTRY } from './widgetRegistry';

/**
 * Contract between authored content and the app.
 *
 * This is the check that makes "adding a lesson is just adding content" safe: a typo in a
 * widget id, a stage out of FR-LESSON-1 order, or a lesson pointing at a mission that
 * does not exist all fail here rather than rendering a broken page.
 */

const registeredIds = Object.keys(WIDGET_REGISTRY);

describe('authored lessons', () => {
  it('ships at least one lesson', () => {
    expect(LESSONS.length).toBeGreaterThan(0);
  });

  it('every lesson is structurally valid', () => {
    for (const lesson of LESSONS) {
      expect(validateLesson(lesson), `lesson ${lesson.id}`).toEqual([]);
    }
  });

  it('every referenced widget is registered in the app', () => {
    for (const lesson of LESSONS) {
      expect(validateLessonWidgets(lesson, registeredIds), `lesson ${lesson.id}`).toEqual([]);
    }
  });

  it('every lesson targets a real campaign mission', () => {
    const missionIds = new Set(MISSIONS.map((m) => m.id));
    for (const lesson of LESSONS) {
      expect(missionIds.has(lesson.missionId), `lesson ${lesson.id} -> ${lesson.missionId}`).toBe(
        true,
      );
    }
  });

  it('lesson ids are unique', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('at most one lesson per mission', () => {
    const missionIds = LESSONS.map((l) => l.missionId);
    expect(new Set(missionIds).size).toBe(missionIds.length);
  });

  it('resolves a lesson from its mission id', () => {
    expect(lessonForMission('toa.build.dfa-ends-01')?.id).toBe('lesson.toa.build.dfa-ends-01');
    expect(lessonForMission('nope.not.a.mission')).toBeUndefined();
  });
});

describe('the migrated reference lesson', () => {
  const lesson = lessonForMission('toa.build.dfa-ends-01')!;

  it('gates progress on actually solving the build (FR-LESSON-3)', () => {
    const gated = lesson.stages.filter((s) => s.requiresCompletion);
    expect(gated).toHaveLength(1);
    expect(gated[0]!.kind).toBe('challenge');
  });

  it('preserves the interactive builder rather than replacing it', () => {
    const widgets = lesson.stages.flatMap((s) =>
      s.blocks.filter((b) => b.kind === 'widget').map((b) => b.widgetId),
    );
    expect(widgets).toContain('dfa-construction');
  });

  it('adds the lesson scaffolding the bespoke mission never had', () => {
    const kinds = lesson.stages.map((s) => s.kind);
    expect(kinds).toContain('mission-brief');
    expect(kinds).toContain('intuition');
    expect(kinds).toContain('common-mistakes');
    expect(kinds).toContain('summary');
  });
});
