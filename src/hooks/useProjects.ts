import { useContext } from 'react';
import { ProjectContext } from '../contexts/project-context';

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
}
