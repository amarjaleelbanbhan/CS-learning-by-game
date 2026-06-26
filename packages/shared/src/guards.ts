/** Runtime assertion that narrows the type when it passes. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Exhaustiveness helper for discriminated unions / switch statements. */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

export type NonEmptyArray<T> = [T, ...T[]];

export const isNonEmpty = <T>(arr: readonly T[]): arr is NonEmptyArray<T> => arr.length > 0;
