import { describe, expect, it } from 'vitest';
import { labId, missionId, moduleId, pluginId, topicId } from '@arc/shared';
import type { SubjectPlugin } from '../src/index.js';
import { PluginRegistry, validatePlugin } from '../src/index.js';

function makePlugin(overrides: Partial<SubjectPlugin> = {}): SubjectPlugin {
  const m1 = missionId('toa.languages');
  const m2 = missionId('toa.dfa');
  return {
    id: pluginId('automata'),
    title: 'Theory of Automata',
    description: 'V1 subject',
    version: '0.0.0',
    modules: [
      {
        id: moduleId('foundations'),
        title: 'Foundations',
        order: 1,
        missions: [
          {
            id: m1,
            title: 'Languages',
            order: 1,
            topicId: topicId('languages'),
            xpReward: 100,
            unlockRequires: [],
            loadContent: async () => ({}),
          },
          {
            id: m2,
            title: 'DFA',
            order: 2,
            topicId: topicId('dfa'),
            xpReward: 150,
            unlockRequires: [m1],
            loadContent: async () => ({}),
          },
        ],
      },
    ],
    labs: [{ id: labId('dfa-lab'), title: 'DFA Lab', load: async () => ({ default: {} }) }],
    problemGenerators: [],
    skillTree: {
      nodes: [
        { missionId: m1, dependsOn: [] },
        { missionId: m2, dependsOn: [m1] },
      ],
    },
    ...overrides,
  };
}

describe('validatePlugin', () => {
  it('accepts a well-formed plugin', () => {
    expect(validatePlugin(makePlugin()).ok).toBe(true);
  });

  it('rejects unlockRequires pointing at unknown missions', () => {
    const plugin = makePlugin({
      modules: [
        {
          id: moduleId('m'),
          title: 'M',
          order: 1,
          missions: [
            {
              id: missionId('a'),
              title: 'A',
              order: 1,
              topicId: topicId('t'),
              xpReward: 10,
              unlockRequires: [missionId('ghost')],
              loadContent: async () => ({}),
            },
          ],
        },
      ],
      skillTree: { nodes: [{ missionId: missionId('a'), dependsOn: [] }] },
    });
    const res = validatePlugin(plugin);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.join()).toMatch(/unknown mission "ghost"/);
  });
});

describe('PluginRegistry', () => {
  it('registers and finds labs', () => {
    const reg = new PluginRegistry();
    reg.register(makePlugin());
    expect(reg.all()).toHaveLength(1);
    expect(reg.findLab(labId('dfa-lab'))?.lab.title).toBe('DFA Lab');
    expect(reg.findLab(labId('missing'))).toBeUndefined();
  });

  it('throws on duplicate registration', () => {
    const reg = new PluginRegistry();
    reg.register(makePlugin());
    expect(() => reg.register(makePlugin())).toThrow(/already registered/);
  });

  it('throws when registering an invalid plugin', () => {
    const reg = new PluginRegistry();
    const bad = makePlugin({
      skillTree: { nodes: [{ missionId: missionId('ghost'), dependsOn: [] }] },
    });
    expect(() => reg.register(bad)).toThrow(/Invalid plugin/);
  });
});
