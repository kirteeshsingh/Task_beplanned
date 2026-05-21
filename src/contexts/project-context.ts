import { createContext } from 'react';
import type { Project, ProjectMember, ProjectWithMeta, Profile } from '../lib/database.types';

export interface ProjectContextType {
  projects: ProjectWithMeta[];
  currentProject: ProjectWithMeta | null;
  members: (ProjectMember & { profile: Profile })[];
  loadingProjects: boolean;
  loadingProjectDetail: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: { name: string; description: string; color: string }) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  inviteMember: (projectId: string, email: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<boolean>;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
