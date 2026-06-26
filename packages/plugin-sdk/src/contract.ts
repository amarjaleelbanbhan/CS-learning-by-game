import type { LabId, MissionId, ModuleId, PluginId, TopicId } from '@arc/shared';

/**
 * FROZEN CONTRACT — Project ARC Reactor plugin boundary.
 *
 * A subject (Theory of Automata, Data Structures, …) ships as a SubjectPlugin.
 * Plugins contribute *data and configuration*, never engine code. Adding a new
 * subject must require ZERO changes to the engines or the app shell.
 *
 * This file is intentionally framework-agnostic: lab UI components are referenced
 * through opaque dynamic-import loaders so the SDK does not depend on React.
 */
export interface SubjectPlugin {
  readonly id: PluginId;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly modules: readonly ModuleManifest[];
  readonly labs: readonly LabRegistration[];
  readonly problemGenerators: readonly GeneratorRegistration[];
  readonly skillTree: SkillTreeSpec;
  /** Optional theme-token overrides used to re-skin the HUD for this subject. */
  readonly theme?: Partial<ThemeTokens>;
}

export interface ModuleManifest {
  readonly id: ModuleId;
  readonly title: string;
  readonly order: number;
  readonly missions: readonly MissionManifest[];
}

export interface MissionManifest {
  readonly id: MissionId;
  readonly title: string;
  readonly order: number;
  readonly topicId: TopicId;
  readonly xpReward: number;
  /** Mission ids that must be completed before this one unlocks. */
  readonly unlockRequires: readonly MissionId[];
  /**
   * Loads the declarative lesson content (all stages). Returned value is validated
   * against the engine-lesson schema at runtime — kept `unknown` here to avoid a
   * dependency from the SDK onto the lesson engine.
   */
  readonly loadContent: () => Promise<unknown>;
}

/** A lab is a lazily-loaded UI component plus an opaque engine configuration. */
export interface LabRegistration {
  readonly id: LabId;
  readonly title: string;
  /** Dynamic-import thunk; the default export is the host-framework component. */
  readonly load: LabComponentLoader;
  readonly defaultConfig?: Readonly<Record<string, unknown>>;
}

export type LabComponentLoader = () => Promise<{ readonly default: unknown }>;

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface GeneratorRegistration {
  readonly topicId: TopicId;
  readonly title: string;
  readonly generate: ProblemGenerator;
}

/** Deterministic: same (difficulty, seed) must always produce the same problem. */
export type ProblemGenerator = (input: {
  readonly difficulty: Difficulty;
  readonly seed: string;
}) => GeneratedProblem;

export interface GeneratedProblem {
  readonly topicId: TopicId;
  readonly difficulty: Difficulty;
  readonly seed: string;
  readonly prompt: string;
  /** Engine-specific payload (target language spec, reference automaton, …). */
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface SkillTreeSpec {
  readonly nodes: readonly SkillTreeNode[];
}

export interface SkillTreeNode {
  readonly missionId: MissionId;
  readonly dependsOn: readonly MissionId[];
  readonly position?: { readonly x: number; readonly y: number };
}

export interface ThemeTokens {
  readonly accent: string;
  readonly accentSecondary: string;
  readonly success: string;
  readonly danger: string;
}
