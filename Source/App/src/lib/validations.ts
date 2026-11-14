import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, "Email or username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").trim(),
  summary: z.string().min(5, "Summary must be at least 5 characters").trim(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid deadline date is required",
  }),
  assigneeIds: z.array(z.string()).min(1, "At least one assignee is required"),
  leadId: z.string().optional(),
});

export const PostUpdateSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  progress: z.number().min(0).max(100, "Progress must be between 0 and 100"),
  note: z.string().min(3, "Note must be at least 3 characters").trim(),
  status: z.enum(["IN_PROGRESS", "PENDING_REVIEW"]).optional(),
  attachments: z.string().optional(),
});

export const ApprovalReviewSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  decision: z.enum(["APPROVED", "REVISION_REQUESTED"]),
  feedback: z.string().optional(),
});

export const CreateEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Valid Google Drive email is required").trim(),
  initialPassword: z.string().min(6).optional(),
});
