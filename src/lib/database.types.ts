export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          color: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          color?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          color?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          role?: 'admin' | 'member';
        };
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          due_date: string | null;
          assigned_to: string | null;
          created_by: string;
          tags: string[];
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          assigned_to?: string | null;
          created_by: string;
          tags?: string[];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string | null;
          assigned_to?: string | null;
          tags?: string[];
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_log: {
        Row: {
          id: string;
          project_id: string | null;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          user_id: string;
          action: string;
          entity_type?: string;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'activity_log_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectMember = Database['public']['Tables']['project_members']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type MemberRole = ProjectMember['role'];

export interface ProjectWithMeta extends Project {
  member_count: number;
  task_count: number;
  completed_count: number;
  members?: (ProjectMember & { profile: Profile })[];
}

export interface TaskWithMeta extends Task {
  assignee?: Profile | null;
  creator?: Profile | null;
}
