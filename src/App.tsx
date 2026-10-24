import React, { useEffect, useMemo, useState } from 'react';
import { Navigation, type NavigationTab } from './components/Navigation';
import { PersonProjectsView } from './components/PersonProjectsView';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectForm } from './components/ProjectForm';
import { SettingsModal } from './components/SettingsModal';
import { SharedList } from './components/SharedList';
import { AuthScreen } from './components/AuthScreen';
import { computeProjectBreakdown, getTodayIsoString } from './lib/projects';
import { projectRepository, apiRepository, type BackendHealth } from './services';
import type { AppSettings, ComputedProject, Project } from './types/project';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currencySymbol: '₹',
    defaultAdvancePercent: 50,
    defaultMySharePercent: 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('project_tracker_auth_session') === 'authenticated';
  });

  const handleLogout = () => {
    localStorage.removeItem('project_tracker_auth_session');
    localStorage.removeItem('project_tracker_logged_user');
    setIsAuthenticated(false);
  };

  // Theme state: light or dark (defaults to system preference or saved setting)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation: Arijeet, Shared, Priya (defaulting to Arijeet)
  const [currentTab, setCurrentTab] = useState<NavigationTab>('arijeet');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load projects & settings from central backend / PostgreSQL
  const loadData = async () => {
    try {
      const health = await apiRepository.checkHealth();
      setBackendHealth(health);

      const [storedProjects, storedSettings] = await Promise.all([
        projectRepository.getAll(),
        projectRepository.getSettings(),
      ]);

      setProjects(storedProjects);
      setSettings(storedSettings);
    } catch (err) {
      console.error('Failed to load projects from central backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-sync polling every 5s & on window focus so Arijeet and Priya stay synchronized
    const interval = setInterval(loadData, 5000);
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const todayIso = useMemo(() => getTodayIsoString(), []);

  const computedProjects: ComputedProject[] = useMemo(() => {
    return projects.map((p) => computeProjectBreakdown(p, todayIso));
  }, [projects, todayIso]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return computedProjects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, computedProjects]);

  // Project Actions
  const handleSaveProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (projectToEdit) {
      await projectRepository.update(projectToEdit.id, projectData);
    } else {
      await projectRepository.create(projectData);
    }
    await loadData();
    setIsProjectFormOpen(false);
    setProjectToEdit(undefined);
  };

  const handleDeleteProject = async (id: string) => {
    await projectRepository.delete(id);
    setSelectedProjectId(null);
    await loadData();
  };

  const handleToggleAdvance = async (
    id: string,
    advanceReceived: boolean,
    advanceReceivedDate?: string
  ) => {
    await projectRepository.update(id, {
      advanceReceived,
      advanceReceivedDate,
    });
    await loadData();
  };

  const handleToggleBalance = async (
    id: string,
    balanceReceived: boolean,
    balanceReceivedDate?: string
  ) => {
    await projectRepository.update(id, {
      balanceReceived,
      balanceReceivedDate,
    });
    await loadData();
  };

  const handleSaveSettings = async (updates: Partial<AppSettings>) => {
    const updated = await projectRepository.saveSettings(updates);
    setSettings(updated);
  };

  const handleExportJSON = async () => {
    return await projectRepository.exportAll();
  };

  const handleImportJSON = async (jsonString: string) => {
    const result = await projectRepository.importAll(jsonString);
    await loadData();
    setSelectedProjectId(null);
    return result;
  };

  const openNewProjectModal = () => {
    setProjectToEdit(undefined);
    setIsProjectFormOpen(true);
  };

  const openEditProjectModal = (proj: ComputedProject) => {
    setProjectToEdit(proj);
    setIsProjectFormOpen(true);
  };

  const handleTabChange = (tab: NavigationTab) => {
    setSelectedProjectId(null);
    setCurrentTab(tab);
  };

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLoginSuccess={() => setIsAuthenticated(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        Loading projects...
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navigation
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewProject={openNewProjectModal}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            settings={settings}
            onBack={() => setSelectedProjectId(null)}
            onEdit={openEditProjectModal}
            onDelete={handleDeleteProject}
            onToggleAdvance={handleToggleAdvance}
            onToggleBalance={handleToggleBalance}
          />
        ) : currentTab === 'arijeet' ? (
          <PersonProjectsView
            person="arijeet"
            displayName="Arijeet"
            projects={computedProjects}
            settings={settings}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenNewProject={openNewProjectModal}
          />
        ) : currentTab === 'shared' ? (
          <SharedList
            projects={computedProjects}
            settings={settings}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenNewProject={openNewProjectModal}
          />
        ) : (
          <PersonProjectsView
            person="priya"
            displayName="Priya"
            projects={computedProjects}
            settings={settings}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenNewProject={openNewProjectModal}
          />
        )}
      </main>

      {/* Add / Edit Project Modal */}
      <ProjectForm
        initialProject={projectToEdit}
        settings={settings}
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setProjectToEdit(undefined);
        }}
        onSave={handleSaveProject}
      />

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        theme={theme}
        onSetTheme={setTheme}
        backendHealth={backendHealth}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;
