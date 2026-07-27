import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Migration lint for row-level security.
 *
 * Postgres enforcing RLS is not in doubt; what actually goes wrong in practice is adding
 * a new user-data table and forgetting to enable RLS or scope a policy to auth.uid(),
 * which silently exposes every user's rows to every other user. That has real precedent
 * here — migrations 0004-0006 each added user tables, and each relied on catching the
 * omission via Supabase advisors after the fact rather than in CI.
 *
 * So this asserts the invariant statically, offline, against the migration SQL itself:
 * every table owned by a user must have RLS enabled AND at least one auth.uid()-scoped
 * policy. No network, no credentials, runs on every commit.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../../supabase/migrations');

/** Tables that are deliberately world-readable reference data, not user-owned rows. */
const PUBLIC_CATALOG_TABLES = new Set(['achievements']);

function allMigrationSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');
}

/** Every `create table [if not exists] public.<name> ( ... )` block, keyed by table name. */
function createdTables(sql: string): Map<string, string> {
  const tables = new Map<string, string>();
  const re = /create table\s+(?:if not exists\s+)?public\.(\w+)\s*\(([\s\S]*?)\n\);/gi;
  for (const m of sql.matchAll(re)) tables.set(m[1]!, m[2]!);
  return tables;
}

const SQL = allMigrationSql();
const TABLES = createdTables(SQL);

/** A table is user-owned if any column references auth.users. */
function isUserOwned(body: string): boolean {
  return /references\s+auth\.users/i.test(body);
}

describe('migrations: row-level security', () => {
  it('parses the migration set (guards against this test silently matching nothing)', () => {
    expect(TABLES.size).toBeGreaterThanOrEqual(13);
    expect([...TABLES.keys()]).toContain('profiles');
    expect([...TABLES.keys()]).toContain('world_state');
  });

  it('enables RLS on every table, without exception', () => {
    for (const table of TABLES.keys()) {
      const enabled = new RegExp(
        `alter table\\s+public\\.${table}\\s+enable row level security`,
        'i',
      ).test(SQL);
      expect(enabled, `${table} is missing "enable row level security"`).toBe(true);
    }
  });

  it('scopes every user-owned table to auth.uid() in at least one policy', () => {
    for (const [table, body] of TABLES) {
      if (!isUserOwned(body) || PUBLIC_CATALOG_TABLES.has(table)) continue;

      const policies = [
        ...SQL.matchAll(
          new RegExp(`create policy\\s+"[^"]+"\\s+on\\s+public\\.${table}\\b([\\s\\S]*?);`, 'gi'),
        ),
      ].map((m) => m[1]!);

      expect(policies.length, `${table} has RLS enabled but no policy at all`).toBeGreaterThan(0);
      expect(
        policies.some((p) => /auth\.uid\(\)/i.test(p)),
        `${table} has policies but none scope rows to auth.uid()`,
      ).toBe(true);
    }
  });

  it('never grants a blanket `using (true)` on a user-owned table', () => {
    for (const [table, body] of TABLES) {
      if (!isUserOwned(body)) continue;
      const blanket = new RegExp(
        `create policy\\s+"[^"]+"\\s+on\\s+public\\.${table}\\b[^;]*?using\\s*\\(\\s*true\\s*\\)`,
        'i',
      ).test(SQL);
      expect(blanket, `${table} exposes all rows via "using (true)"`).toBe(false);
    }
  });

  it('keeps the public catalog readable but not user-writable', () => {
    // achievements is the one intentional `using (true)` — a shared, read-only catalog.
    expect(/create policy[^;]*on public\.achievements for select using \(true\)/i.test(SQL)).toBe(
      true,
    );
    expect(
      /create policy[^;]*on public\.achievements for (insert|update|delete|all)/i.test(SQL),
      'achievements must not be writable by anon/authenticated roles',
    ).toBe(false);
  });
});
