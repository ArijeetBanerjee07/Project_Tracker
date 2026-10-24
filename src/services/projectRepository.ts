import type { AppSettings, Project } from '../types/project';

export interface IProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | undefined>;
  create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  update(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project>;
  delete(id: string): Promise<void>;
  clearAll(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(jsonString: string): Promise<{ count: number }>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
}
