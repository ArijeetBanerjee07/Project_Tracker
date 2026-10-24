import Dexie, { type Table } from 'dexie';
import type { AppSettings, Project } from '../types/project';

export interface StoredSettings extends AppSettings {
  id: string; // 'current_settings'
}

export class ProjectTrackerDatabase extends Dexie {
  projects!: Table<Project, string>;
  settings!: Table<StoredSettings, string>;

  constructor() {
    super('ProjectTrackerDB');
    this.version(1).stores({
      projects: 'id, ownership, status, tentativeDeadline, institute, createdAt',
      settings: 'id',
    });
  }
}

export const db = new ProjectTrackerDatabase();
