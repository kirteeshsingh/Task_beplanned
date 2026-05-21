import { useState, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Project, ProjectWithMeta, ProjectMember, Profile } from '../lib/database.types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ProjectContext } from './project-context';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWithMeta | null>(null);
  const [members, setMembers] = useState<(ProjectMember & { profile: Profile })[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false);
  const projectDetailSeq = useRef(0);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoadingProjects(true);
    try {
      const { data: memberRows, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const projectIds = (memberRows ?? []).map((r) => r.project_id);
      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('updated_at', { ascending: false });

      if (projectError) throw projectError;

      if (!projectData) {
        setProjects([]);
        return;
      }

      const enriched: ProjectWithMeta[] = await Promise.all(
        projectData.map(async (p) => {
          const [{ count: memberCount }, { count: taskCount }, { count: completedCount }] = await Promise.all([
            supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id),
            supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', p.id)
              .eq('status', 'done'),
          ]);
          return {
            ...p,
            member_count: memberCount ?? 0,
            task_count: taskCount ?? 0,
            completed_count: completedCount ?? 0,
          };
        })
      );

      setProjects(enriched);
    } catch (error) {
      console.error('Failed to load projects', error);
      toast.error('Unable to load projects');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  const fetchProject = useCallback(async (id: string) => {
    const seq = ++projectDetailSeq.current;
    setLoadingProjectDetail(true);
    try {
      const { data: p, error: projectError } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
      if (projectDetailSeq.current !== seq) return;

      if (projectError) {
        console.error('Failed to load project', projectError);
        toast.error('Unable to load project');
        setCurrentProject(null);
        setMembers([]);
        return;
      }

      if (!p) {
        setCurrentProject(null);
        setMembers([]);
        return;
      }

      const [{ count: memberCount }, { count: taskCount }, { count: completedCount }, { data: memberData }] =
        await Promise.all([
          supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('project_id', id),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id),
          supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id)
            .eq('status', 'done'),
          supabase.from('project_members').select('*, profile:profiles(*)').eq('project_id', id),
        ]);

      if (projectDetailSeq.current !== seq) return;

      const memberList = (memberData as (ProjectMember & { profile: Profile })[]) ?? [];
      const enriched: ProjectWithMeta = {
        ...p,
        member_count: memberCount ?? 0,
        task_count: taskCount ?? 0,
        completed_count: completedCount ?? 0,
        members: memberList,
      };

      setCurrentProject(enriched);
      setMembers(memberList);
    } finally {
      if (projectDetailSeq.current === seq) {
        setLoadingProjectDetail(false);
      }
    }
  }, []);

  const createProject = useCallback(
    async (data: { name: string; description: string; color: string }): Promise<Project | null> => {
      if (!user) return null;
      const now = new Date().toISOString();
      const project: Project = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        color: data.color,
        owner_id: user.id,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase.from('projects').insert(project);

      if (error) {
        console.error('Failed to create project', error);
        toast.error(error.message || 'Failed to create project');
        return null;
      }

      const { error: activityError } = await supabase.from('activity_log').insert({
        project_id: project.id,
        user_id: user.id,
        action: 'created project',
        entity_type: 'project',
        entity_id: project.id,
        meta: { name: project.name },
      });
      if (activityError) {
        console.error('Failed to record project creation activity', activityError);
      }

      await fetchProjects();
      return project;
    },
    [user, fetchProjects]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Project>) => {
      const { error } = await supabase
        .from('projects')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error('Failed to update project', error);
        toast.error(error.message || 'Unable to update workspace');
        return false;
      }
      await fetchProjects();
      if (currentProject?.id === id) await fetchProject(id);
      return true;
    },
    [fetchProjects, fetchProject, currentProject]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const previousProjects = projects;
      const previousCurrent = currentProject;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProject?.id === id) setCurrentProject(null);

      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete project', error);
        toast.error(error.message || 'Unable to delete workspace');
        setProjects(previousProjects);
        setCurrentProject(previousCurrent);
        return false;
      }
      return true;
    },
    [currentProject, projects]
  );

  const inviteMember = useCallback(
    async (projectId: string, email: string) => {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (!targetProfile) {
        toast.error('No user found with that email address');
        return;
      }

      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: targetProfile.id,
        role: 'member',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('This user is already a member');
        } else {
          toast.error('Failed to invite member');
        }
        return;
      }

      if (user) {
        const { error: activityError } = await supabase.from('activity_log').insert({
          project_id: projectId,
          user_id: user.id,
          action: 'invited member',
          entity_type: 'member',
          entity_id: targetProfile.id,
          meta: { email },
        });
        if (activityError) {
          console.error('Failed to record member invite activity', activityError);
        }
      }

      await fetchProject(projectId);
      toast.success(`${targetProfile.full_name || email} added to project`);
    },
    [user, fetchProject]
  );

  const removeMember = useCallback(
    async (projectId: string, memberUserId: string) => {
      const previousMembers = members;
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));

      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', memberUserId);
      if (error) {
        console.error('Failed to remove member', error);
        toast.error(error.message || 'Unable to remove member');
        setMembers(previousMembers);
        return false;
      }
      await fetchProject(projectId);
      toast.success('Member removed');
      return true;
    },
    [fetchProject, members]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        members,
        loadingProjects,
        loadingProjectDetail,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        inviteMember,
        removeMember,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
