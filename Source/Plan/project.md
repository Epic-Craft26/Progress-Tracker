# Epic Craft – Project Progress Tracker

A web application to track the live progress of company projects. The CEO assigns projects to employees, a project folder is created automatically on the drive, and everyone sees real-time updates.

---

## 1. Overview

| Item | Detail |
|------|--------|
| Company | Epic Craft |
| Purpose | Track live updates and progress of projects |
| Roles | CEO (admin), Employee |
| Storage | Drive (Google Drive recommended), one folder per project |

---

## 2. Core Flow

1. **Setup (CEO/admin):** CEO creates employee accounts. Each employee gets a unique ID (e.g. `EC-0001`) and a first-time password or PIN.
2. **Login:** Users log in with their ID. The system checks the role and opens the CEO panel or the Employee panel.
3. **Project creation (CEO):** CEO enters title, summary, deadline, priority and assignees, then clicks **Assign**.
4. **Automatic actions on Assign:**
   - A project folder is created on the drive, e.g. `Epic Craft / Projects / <ProjectName>`.
   - Access is granted to the assigned employees only (editor) and the CEO (owner).
   - A notification is sent to each assignee: "You've been assigned to *Project X*", with the summary, deadline and folder link.
5. **Work and updates (Employee):** Employee opens the project, updates status and progress %, writes daily/weekly updates, and uploads files to the drive folder.
6. **Live tracking:** Every update is saved and the CEO dashboard refreshes immediately.
7. **Completion:** Employee marks the project "Completed" with a final summary. CEO reviews and approves. The project moves into the employee's completed history and stats.

```
CEO creates employee IDs
        |
   User logs in with ID
        |
   +----+-----------------+
   |                      |
 CEO Panel          Employee Panel
   |                      |
 Assign project           |
   |                      |
   +--> Drive folder created + access shared
   +--> Notification sent ------------------> Employee receives it
                                                   |
                                         Updates progress / uploads files
                                                   |
   Live dashboard updates <------------------------+
        |
   CEO reviews and approves
        |
   Project moves to completed history
```

---

## 3. Employee Panel

- **Home / stats:** Projects completed, in progress, pending, overdue, on-time completion rate.
- **My projects:** List with status, progress bar, deadline and priority.
- **Completed projects:** History with a detailed summary for each (what was done, role, dates, files).
- **Project detail page:** Description, deadline, team members, drive folder link, task list, update timeline, comments.
- **Update form:** Progress %, status, note on what was done, file upload.
- **Notifications:** New assignments, deadline reminders, CEO comments and approvals.
- **Profile:** Name, ID, role, change password.

## 4. CEO Panel

- **Overall dashboard:** Total projects; active, completed, delayed and not-started counts; charts for progress by project and workload by employee.
- **Create and assign project:** Form for title, summary, deadline, priority and assignees; drive folder is created automatically.
- **All projects:** Table filterable by status, employee or deadline, with live progress bars.
- **Project detail view:** Full update timeline, files in the folder, team, comments.
- **Employee management:** Add, edit or deactivate employees, issue IDs, view each employee's stats (completed, in progress, on-time rate).
- **Review and approvals:** Approve or reject completed projects and send feedback.
- **Activity feed:** Live stream of who updated what and when.
- **Alerts:** Overdue projects, stalled projects with no recent updates, newly completed projects.
- **Reports:** Export weekly or monthly progress as PDF or Excel.

---

## 5. Key Decisions

- **Drive:** Google Drive. Its API can create folders and share them with employee emails, so each employee profile must store an email.
- **Notifications:** In-app plus email at first; WhatsApp or push can be added later.
- **Roles:** Only CEO and Employee initially; a Manager role can come later.
- **Login security:** Pair the ID with a password or OTP. An ID alone is weak.

---

## 6. Suggested Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React or Next.js |
| Backend | Node.js or FastAPI |
| Database | PostgreSQL |
| Live updates | WebSockets |
| File storage | Google Drive API |
| Auth | JWT with ID + password/OTP |

---

## 7. Next Steps

- [ ] Finalize database schema (users, projects, assignments, updates, notifications)
- [ ] Design wireframes for the CEO and Employee panels
- [ ] Set up Google Drive API (service account, folder creation, permission sharing)
- [ ] Build authentication and role-based routing
- [ ] Build project assignment + notification flow
- [ ] Build live dashboards
- [ ] Testing and deployment
