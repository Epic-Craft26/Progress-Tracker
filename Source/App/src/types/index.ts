export type Role = "CEO" | "EMPLOYEE";

export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ProjectStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "REVISION_REQUESTED"
  | "COMPLETED";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface ProjectData {
  id: string;
  code: string;
  title: string;
  summary: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignees: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  tasksCount?: {
    total: number;
    completed: number;
  };
  updatesCount?: number;
}
