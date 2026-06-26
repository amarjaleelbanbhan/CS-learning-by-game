/**
 * Branded (nominal) id types. Prevents accidentally passing a MissionId where a
 * StateId is expected, even though both are strings at runtime.
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type StateId = Brand<string, 'StateId'>;
export type MissionId = Brand<string, 'MissionId'>;
export type ModuleId = Brand<string, 'ModuleId'>;
export type TopicId = Brand<string, 'TopicId'>;
export type PluginId = Brand<string, 'PluginId'>;
export type LabId = Brand<string, 'LabId'>;

export const stateId = (s: string): StateId => s as StateId;
export const missionId = (s: string): MissionId => s as MissionId;
export const moduleId = (s: string): ModuleId => s as ModuleId;
export const topicId = (s: string): TopicId => s as TopicId;
export const pluginId = (s: string): PluginId => s as PluginId;
export const labId = (s: string): LabId => s as LabId;
