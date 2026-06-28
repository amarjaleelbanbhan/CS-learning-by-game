/**
 * @arc/engine-progress
 *
 * Mastery model, completion %, spaced-repetition scheduling (existing scope), plus the
 * Engineer Career engine: rank ladder, department reputation, certifications, blueprint
 * unlocks, laboratory tiers, and career milestones. All pure data-driven functions —
 * subject plugins supply the content, this package only evaluates it.
 */
export const PACKAGE_NAME = '@arc/engine-progress' as const;

export * from './career.js';
