# Epic Craft – Project Progress Tracker

A full-stack, enterprise-grade progress tracking and project management web application for **Epic Craft**, built using the **DashStack UI Kit** aesthetic, **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

---

## 🌟 Key Features

1. **CEO Executive Command Center**
   - **4 DashStack KPI Metric Cards:** Live counts for Active Projects, Pending Approvals, Overdue/Stalled Projects, and On-Time Completion Rate.
   - **Live Activity Stream:** Real-time feed of employee submissions, milestone logs, and Drive file attachments.
   - **Projects Central Hub:** Filterable data table with live progress bars, priority badges, assignee avatar stacks, and direct Google Drive links.
   - **One-Click Project Assignment:** Auto-generates unique project codes (e.g. `EC-PRJ-004`) and auto-provisions shared Google Drive directories.
   - **Approval Queue:** CEO review workflow with one-click **Approve & Archive** or **Request Revision** with detailed feedback.
   - **Team Directory & ID Issuance:** Add employees, issue unique `EC-XXXX` IDs, and configure Google Account emails for Drive permission sharing.
   - **Export Reports:** Download project status summaries in CSV format.

2. **Employee Progress Workspace**
   - **Personalized KPI Dashboard:** Active tasks, items in review, completed projects, and personal on-time delivery rate.
   - **Quick Update Modal:** Slider to adjust live progress %, log work notes, and submit for CEO sign-off.
   - **Direct Google Drive Deep-Links:** One-click launch into the project's dedicated Drive folder.
   - **Completed Projects History:** Comprehensive archive with CEO approval feedback.

3. **DashStack Design System**
   - **Primary Palette:** DashStack Signature Blue (`#4880FF`), Mint Emerald (`#00B69B`), Warm Amber (`#FF9F43`), Crimson Red (`#EF3826`), Canvas Neutral (`#F5F6FA`).
   - **Rounded Cards:** Signature `14px` border-radius container layout.
   - **Responsive Shell:** Collapsible sidebar, global search, live status pulse, and notification badge.

4. **Security & Access Control**
   - Role-Based Access Control (`CEO` vs `EMPLOYEE`) enforced via Next.js Edge Middleware.
   - Secure authentication with `bcryptjs` password hashing and `jose` JWT cookies.
   - Mandatory first-time password reset for newly issued employee accounts.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js >= 18
- npm or yarn

### 2. Installation & Setup
```bash
cd Source/App

# Install dependencies (already pre-installed)
npm install

# Push database schema to local SQLite
npx prisma db push

# Seed the database with CEO & demo employees
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Accounts & Access

| Role | Employee ID | Initial Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **CEO (Admin)** | `EC-0001` | `Admin@123` | Executive Dashboard, Assign Projects, Approval Queue, Employee Directory, Reports |
| **Employee (Lead)** | `EC-0002` | `Pass@123` | My Projects, Post Progress Updates, Submit for CEO Review, Drive Workspace |
| **Employee** | `EC-0003` | `Pass@123` | My Projects, Post Progress Updates, Submit for CEO Review |
| **New Employees** | Auto-assigned | Auto-generated PIN | One-time temporary key generated on account creation with mandatory password change |

---

## 📁 Repository Structure

```
Epic_Craft/Progress/
├── Source/
│   ├── Plan/
│   │   └── project.md               # Original project specification
│   └── App/                         # Full-stack Next.js application
│       ├── prisma/
│       │   ├── schema.prisma        # Prisma relational models
│       │   ├── seed.js              # Database seed script
│       │   └── dev.db               # SQLite database
│       ├── src/
│       │   ├── app/                 # Next.js App Router pages & API routes
│       │   │   ├── api/             # REST & SSE endpoints (auth, projects, updates, etc.)
│       │   │   ├── ceo/             # CEO views (Dashboard, Projects, Assign, Approvals)
│       │   │   ├── employee/        # Employee views (Dashboard, Projects, History)
│       │   │   ├── login/           # Authentication page
│       │   │   └── reset-password/  # Password reset flow
│       │   ├── components/          # DashStack UI primitives & layout shells
│       │   │   ├── dashboard/       # MetricCard, activity feeds
│       │   │   ├── layout/          # Sidebar, Header, AppLayout
│       │   │   └── ui/              # Card, Button, Badge, ProgressBar, Avatar, Modal
│       │   ├── lib/                 # Auth, Prisma client, Zod validations, project utils
│       │   ├── services/            # Google Drive provisioning service
│       │   └── types/               # TypeScript definitions
│       └── tests/
│           ├── db.test.js           # Database & schema validation test
│           └── e2e.test.js          # Full lifecycle end-to-end test
└── docs/
    └── superpowers/plans/           # Phased implementation plan
```

---

## 🧪 Testing

To run the automated test suite:
```bash
cd Source/App

# Run database relational verification
node tests/db.test.js

# Run full project lifecycle end-to-end test
node tests/e2e.test.js
```
