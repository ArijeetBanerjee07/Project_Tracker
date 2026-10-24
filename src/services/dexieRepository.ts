import type { AppSettings, Project } from '../types/project';
import { db } from './dexieDb';
import type { IProjectRepository } from './projectRepository';

const SETTINGS_KEY = 'current_settings';

const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '₹',
  defaultAdvancePercent: 50,
  defaultMySharePercent: 50,
};

export class DexieProjectRepository implements IProjectRepository {
  async getAll(): Promise<Project[]> {
    const list = await db.projects.toArray();
    // Default sort by tentativeDeadline ascending
    return list.sort((a, b) => {
      if (!a.tentativeDeadline) return 1;
      if (!b.tentativeDeadline) return -1;
      return a.tentativeDeadline.localeCompare(b.tentativeDeadline);
    });
  }

  async getById(id: string): Promise<Project | undefined> {
    return await db.projects.get(id);
  }

  async create(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    const now = new Date().toISOString();
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'proj_' + Math.random().toString(36).substring(2, 11);

    const newProject: Project = {
      ...projectData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.projects.add(newProject);
    return newProject;
  }

  async update(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    const existing = await db.projects.get(id);
    if (!existing) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.projects.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.projects.delete(id);
  }

  async clearAll(): Promise<void> {
    await db.projects.clear();
  }

  async exportAll(): Promise<string> {
    const projects = await db.projects.toArray();
    const settings = await this.getSettings();

    const exportData = {
      version: 1,
      appName: 'ProjectTrackerPWA',
      exportedAt: new Date().toISOString(),
      settings,
      projects,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importAll(jsonString: string): Promise<{ count: number }> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON format. Please select a valid backup JSON file.');
    }

    if (!parsed || !Array.isArray(parsed.projects)) {
      throw new Error('Malformed backup file: missing "projects" list.');
    }

    const projects: Project[] = parsed.projects;

    // Validate that each project has required minimal fields
    for (const p of projects) {
      if (!p.id || !p.title || !p.institute || typeof p.totalAmount !== 'number') {
        throw new Error(
          `Invalid project record found (id: ${p.id || 'unknown'}). Aborting import.`
        );
      }
    }

    await db.transaction('rw', db.projects, db.settings, async () => {
      await db.projects.clear();
      await db.projects.bulkAdd(projects);

      if (parsed.settings && typeof parsed.settings === 'object') {
        await db.settings.put({
          id: SETTINGS_KEY,
          currencySymbol: parsed.settings.currencySymbol || DEFAULT_SETTINGS.currencySymbol,
          defaultAdvancePercent:
            parsed.settings.defaultAdvancePercent ?? DEFAULT_SETTINGS.defaultAdvancePercent,
          defaultMySharePercent:
            parsed.settings.defaultMySharePercent ?? DEFAULT_SETTINGS.defaultMySharePercent,
        });
      }
    });

    return { count: projects.length };
  }

  async getSettings(): Promise<AppSettings> {
    const stored = await db.settings.get(SETTINGS_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      currencySymbol: stored.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
      defaultAdvancePercent:
        stored.defaultAdvancePercent ?? DEFAULT_SETTINGS.defaultAdvancePercent,
      defaultMySharePercent:
        stored.defaultMySharePercent ?? DEFAULT_SETTINGS.defaultMySharePercent,
    };
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...settings,
    };

    await db.settings.put({
      ...updated,
      id: SETTINGS_KEY,
    });

    return updated;
  }
}

// Single repository instance exported for use throughout the application
export const projectRepository = new DexieProjectRepository();
