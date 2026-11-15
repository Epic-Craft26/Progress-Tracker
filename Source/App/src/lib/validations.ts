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
  category: z.string().default("General"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  startDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Valid start date is required",
    })
    .optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid deadline date is required",
  }),
  assigneeIds: z.array(z.string()).min(1, "At least one assignee is required"),
  leadId: z.string().optional(),
  driveFolderUrl: z.string().optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(2, "Milestone title required"),
        dueDate: z
          .string()
          .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Valid task due date",
          })
          .optional(),
      })
    )
    .optional(),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(3).optional(),
  summary: z.string().min(5).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "PENDING_REVIEW",
      "REVISION_REQUESTED",
      "COMPLETED",
    ])
    .optional(),
  startDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Valid start date is required",
    })
    .optional(),
  deadline: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Valid date required",
    })
    .optional(),
  driveFolderUrl: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
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
  designation: z.string().optional(),
  department: z.string().optional(),
  initialPassword: z.string().min(6).optional(),
});

export const UpdateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  action: z.enum(["UPDATE", "RESET_PASSWORD", "TOGGLE_ACTIVE"]).optional(),
});
