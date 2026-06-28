/**
 * @arc/engine-analytics
 *
 * Aggregation of events into learning metrics. Currently: Player Statistics
 * (mission attempt log -> totals, accuracy, streaks, weakest/most-improved topic).
 */
export const PACKAGE_NAME = '@arc/engine-analytics' as const;

export * from './statistics.js';
