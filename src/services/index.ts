import { apiRepository, type BackendHealth } from './apiRepository';
import { DexieProjectRepository, projectRepository as localDexieRepository } from './dexieRepository';
import type { IProjectRepository } from './projectRepository';

// Primary repository: ApiProjectRepository ensures live synchronization across
// devices so Arijeet and Priya both see real-time updates and shared projects.
export const projectRepository: IProjectRepository = apiRepository;

export { apiRepository, localDexieRepository, DexieProjectRepository };
export type { BackendHealth };
export type { IProjectRepository };
