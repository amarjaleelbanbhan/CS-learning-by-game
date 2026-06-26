import type { Result } from '@arc/shared';
import { err, ok } from '@arc/shared';
import type { SubjectPlugin } from './contract.js';

/**
 * Structural integrity check for a plugin, run in CI and at registration time.
 * Catches authoring mistakes (dangling unlock requirements, duplicate ids,
 * skill-tree references to missions that don't exist).
 */
export function validatePlugin(plugin: SubjectPlugin): Result<true, string[]> {
  const errors: string[] = [];
  const missionIds = new Set<string>();

  for (const mod of plugin.modules) {
    for (const mission of mod.missions) {
      if (missionIds.has(mission.id)) errors.push(`Duplicate mission id: ${mission.id}`);
      missionIds.add(mission.id);
    }
  }

  for (const mod of plugin.modules) {
    for (const mission of mod.missions) {
      for (const req of mission.unlockRequires) {
        if (!missionIds.has(req)) {
          errors.push(`Mission "${mission.id}" requires unknown mission "${req}"`);
        }
      }
    }
  }

  for (const node of plugin.skillTree.nodes) {
    if (!missionIds.has(node.missionId)) {
      errors.push(`Skill-tree node references unknown mission "${node.missionId}"`);
    }
    for (const dep of node.dependsOn) {
      if (!missionIds.has(dep)) {
        errors.push(`Skill-tree node "${node.missionId}" depends on unknown mission "${dep}"`);
      }
    }
  }

  const labIds = new Set<string>();
  for (const lab of plugin.labs) {
    if (labIds.has(lab.id)) errors.push(`Duplicate lab id: ${lab.id}`);
    labIds.add(lab.id);
  }

  return errors.length === 0 ? ok(true) : err(errors);
}
