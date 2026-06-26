/**
 * Result<T, E> — explicit success/failure without exceptions.
 * Engines return Result for recoverable errors so callers must handle both paths.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

export function mapResult<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export function expect<T, E>(r: Result<T, E>, message: string): T {
  if (r.ok) return r.value;
  throw new Error(`${message}: ${String(r.error)}`);
}
