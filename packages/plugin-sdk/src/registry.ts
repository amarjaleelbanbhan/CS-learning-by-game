import type { LabId, PluginId } from '@arc/shared';
import type { LabRegistration, SubjectPlugin } from './contract.js';
import { validatePlugin } from './validate.js';

/**
 * Holds the set of registered subject plugins. The app builds one registry at
 * startup; engines never touch it.
 */
export class PluginRegistry {
  private readonly plugins = new Map<PluginId, SubjectPlugin>();

  register(plugin: SubjectPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin already registered: ${plugin.id}`);
    }
    const validation = validatePlugin(plugin);
    if (!validation.ok) {
      throw new Error(`Invalid plugin "${plugin.id}":\n - ${validation.error.join('\n - ')}`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: PluginId): SubjectPlugin | undefined {
    return this.plugins.get(id);
  }

  all(): readonly SubjectPlugin[] {
    return [...this.plugins.values()];
  }

  findLab(id: LabId): { plugin: SubjectPlugin; lab: LabRegistration } | undefined {
    for (const plugin of this.plugins.values()) {
      const lab = plugin.labs.find((l) => l.id === id);
      if (lab) return { plugin, lab };
    }
    return undefined;
  }
}
