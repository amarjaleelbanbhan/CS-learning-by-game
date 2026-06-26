/**
 * Architectural boundary rules for Project ARC Reactor.
 *
 * The dependency rule is inward-only:
 *   app/plugins -> engines -> shared
 *
 * Engines MUST stay framework-agnostic (no React/Next/Supabase/DOM) and MUST NOT
 * depend on subject plugins or the app. This config fails CI when a boundary is crossed.
 */
module.exports = {
  forbidden: [
    {
      name: 'engines-no-frameworks',
      comment:
        'Engine packages must be pure TypeScript (no React, Next, Supabase, or DOM-coupled libs).',
      severity: 'error',
      from: { path: '^packages/engine-[^/]+/src' },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-peer'],
        path: 'node_modules/(react|react-dom|next|@supabase|framer-motion|gsap|reactflow|d3|three|@react-three)',
      },
    },
    {
      name: 'engines-no-plugins',
      comment: 'Engines must not depend on subject plugins (dependency direction is inward).',
      severity: 'error',
      from: { path: '^packages/engine-[^/]+/src' },
      to: { path: '^packages/plugin-' },
    },
    {
      name: 'engines-no-app',
      comment: 'Engines must not depend on the web app.',
      severity: 'error',
      from: { path: '^packages/engine-' },
      to: { path: '^apps/' },
    },
    {
      name: 'shared-is-leaf',
      comment: 'packages/shared must not depend on any other workspace package.',
      severity: 'error',
      from: { path: '^packages/shared/src' },
      to: { path: '^packages/(?!shared)' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies between modules.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
