import type { AppSettings, Project } from '../types/project';
import type { IProjectRepository } from './projectRepository';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface BackendHealth {
  status: string;
  mode: 'postgresql' | 'memory_fallback';
  db: {
    connected: boolean;
    databaseUrl: string;
    error: string | null;
  };
}

export class ApiProjectRepository implements IProjectRepository {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorMsg = `Server error: ${res.statusText} (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) errorMsg = data.error;
      } catch {
        // use fallback message
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  async checkHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<Project[]> {
    const list = await this.request<Project[]>('/projects');
    return list.sort((a, b) => {
      if (!a.tentativeDeadline) return 1;
      if (!b.tentativeDeadline) return -1;
      return a.tentativeDeadline.localeCompare(b.tentativeDeadline);
    });
  }

  async getById(id: string): Promise<Project | undefined> {
    try {
      return await this.request<Project>(`/projects/${id}`);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) return undefined;
      throw err;
    }
  }

  async create(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    return await this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    return await this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async delete(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAll(): Promise<void> {
    await this.request<{ success: boolean }>('/projects/clear', {
      method: 'POST',
    });
  }

  async exportAll(): Promise<string> {
    const data = await this.request<any>('/export');
    return JSON.stringify(data, null, 2);
  }

  async importAll(jsonString: string): Promise<{ count: number }> {
    return await this.request<{ count: number }>('/import', {
      method: 'POST',
      body: JSON.stringify({ jsonString }),
    });
  }

  async getSettings(): Promise<AppSettings> {
    return await this.request<AppSettings>('/settings');
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return await this.request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiRepository = new ApiProjectRepository();
