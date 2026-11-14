# Epic Craft – Project Progress Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, full-stack Project Progress Tracker for Epic Craft featuring CEO assignment, automated Google Drive folder provisioning, live progress tracking, role-based dashboards, and the DashStack admin UI design system.

**Architecture:** Next.js (App Router, TypeScript) with server actions and API routes, Tailwind CSS customized with DashStack design tokens, SQLite/PostgreSQL with Prisma ORM for reliable relational integrity, Server-Sent Events (SSE) for instant real-time synchronization, and modular Google Drive provisioning service.

**Tech Stack:** Next.js 15 / React 19, TypeScript, Tailwind CSS, Lucide React, Prisma ORM, Zod, bcryptjs, Jose (JWT).

**Spec:** `/home/karan/Data/Epic_Craft/Progress/Source/Plan/project.md`

---

## Global Constraints
- Target platform: Linux / Web.
- Node.js version: >= 20.
- Database: Prisma with SQLite (out-of-the-box local execution, easily switchable to PostgreSQL via DATABASE_URL).
- UI Framework: Tailwind CSS adhering strictly to DashStack UI Kit tokens (`#4880FF` primary, `#F5F6FA` canvas, `#00B69B` success, `#FF9F43` warning, `#EF3826` danger).
- User identification: `EC-XXXX` ID format paired with secure credentials.
- After each phase, perform code quality verification, automated testing, and review findings before moving to the next phase.

---

## Implementation Tasks

### Task 1: Project Scaffolding & DashStack Design System
- [ ] Initialize Next.js project with TypeScript, Tailwind CSS, and Lucide Icons in `Source/App`.
- [ ] Configure Tailwind theme with DashStack color tokens, border radius (`14px`), and typography.
- [ ] Build reusable UI primitives: `Card`, `Badge`, `Button`, `ProgressBar`, `Avatar`, `Modal`.
- [ ] Build global layout shell: DashStack responsive Sidebar, Topbar with notification bell and profile badge.
- [ ] Run build test and verify layout rendering.
- [ ] Run code review on Task 1 changes.

### Task 2: Data Layer & Schema Modeling (Prisma)
- [ ] Initialize Prisma in `Source/App/prisma/schema.prisma`.
- [ ] Define models: `User` (with roles `CEO` / `EMPLOYEE`, Google Drive email, ID `EC-XXXX`), `Project`, `ProjectMember`, `Task`, `ProjectUpdate`, `ApprovalReview`, `Notification`.
- [ ] Create seed script with default CEO account (`EC-0001`), sample employees, and mock projects.
- [ ] Write database utility functions and Zod validation schemas for project & update payloads.
- [ ] Run Prisma migration and seed database.
- [ ] Write and run automated tests for data access methods.
- [ ] Run code review on Task 2 changes.

### Task 3: Authentication & Role-Based Routing
- [ ] Implement password hashing with bcryptjs and JWT session management.
- [ ] Create login API route and login screen supporting `EC-XXXX` ID + password.
- [ ] Implement mandatory password change flow if `mustChangePassword` is true.
- [ ] Implement role-based navigation and middleware route protection (`/ceo/*` vs `/employee/*`).
- [ ] Write integration test verifying access controls.
- [ ] Run code review on Task 3 changes.

### Task 4: CEO Panel & Executive Oversight
- [ ] Build CEO Overview Dashboard with 4 DashStack KPI widgets (Active, Pending Review, Overdue, On-Time %).
- [ ] Build Projects Data Table with filtering by status, search by code/title, and progress bars.
- [ ] Build `+ Assign Project` modal with employee multi-select, priority, deadline, and Drive folder name generator.
- [ ] Build Approval Queue interface: CEO review of completed submissions with Approve and Request Revision actions.
- [ ] Build Employee Management interface (create employee with auto-generated `EC-XXXX` ID, manage status).
- [ ] Test CEO flows end-to-end and run code review.

### Task 5: Employee Panel & Work Logs
- [ ] Build Employee Dashboard (personal stats, assigned active projects, deadlines).
- [ ] Build Project Detail view with subtasks checklist, Drive folder launcher, and team members.
- [ ] Build "Post Progress Update" modal (slider `0-100%`, work notes, status change).
- [ ] Build "Submit for Final Approval" flow with summary notes.
- [ ] Test employee update flows and run code review.

### Task 6: Google Drive Provisioning & Real-time Sync
- [ ] Create Google Drive service adapter (`services/drive.ts`) with automatic folder creation logic, permission assignment, and mock/fallback mode.
- [ ] Implement Server-Sent Events (SSE) route `/api/realtime` to push live dashboard events and update feeds immediately upon status changes.
- [ ] Add PDF / CSV export feature for project summaries and team reports.
- [ ] Verify live synchronization across concurrent browser tabs.
- [ ] Run code review on Task 6 changes.

### Task 7: Final Verification & System Hardening
- [ ] Run full end-to-end integration test suite.
- [ ] Perform security audit (input sanitization, privilege escalation checks, token lifetimes).
- [ ] Review performance and ensure zero compile/lint warnings.
- [ ] Document setup, environment variables, and execution runbook in `README.md`.
