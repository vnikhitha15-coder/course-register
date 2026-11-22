# Course Registration System MVP

A production-ready, transaction-safe, full-stack Course Registration System web application designed for academic institutions.

The application serves two distinct user roles:
- **Students:** Sign up, log in, browse and search course offerings with real-time seat availability, enroll in courses (with strict duplicate-registration and capacity enforcement), inspect enrolled course schedules, and drop courses.
- **Administrators:** Oversee the academic curriculum catalog (create, edit, and delete courses) and inspect, filter, and manage all student enrollments across the institution.

---

## Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) (App Router, TypeScript), React 18, [Tailwind CSS](https://tailwindcss.com/), [lucide-react](https://lucide.dev/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/) (TypeScript), [Zod](https://zod.dev/), Helmet, CORS, Cookie-Parser, Express-Rate-Limit |
| **Database & ORM** | PostgreSQL + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | JWT (`jsonwebtoken`) in `HttpOnly` Lax cookies + `Authorization: Bearer` fallback, hashed with `bcryptjs` (12 rounds) |

---

## Monorepo Layout

```text
course-register/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # PostgreSQL schema with relational constraints & indexes
│   │   └── seed.ts                 # Idempotent seed script (admin, students, courses, enrollments)
│   ├── scripts/
│   │   └── start-db.ts             # Embedded / local PostgreSQL runner
│   ├── src/
│   │   ├── config/                 # Zod-validated environment config & Prisma singleton
│   │   ├── controllers/            # Auth, Course, Enrollment, and Admin business logic
│   │   ├── middleware/             # JWT auth, RBAC role guard, Zod validator, error mapper
│   │   ├── routes/                 # Express API routes
│   │   ├── utils/                  # AppError class & JWT sign/verify helpers
│   │   ├── validators/             # Zod input schemas
│   │   ├── app.ts                  # Express application setup
│   │   └── index.ts                # Server bootstrap with graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login & Student Registration pages
│   │   │   ├── (student)/          # Course catalog (/courses) & My Enrollments (/my-courses)
│   │   │   ├── (admin)/            # Admin catalog (/admin/courses) & Roster (/admin/enrollments)
│   │   │   ├── globals.css         # Academic design system styling tokens
│   │   │   ├── layout.tsx          # Root layout, Google Fonts, AuthProvider, ToastProvider
│   │   │   └── page.tsx            # Role-aware automatic session redirect
│   │   ├── components/
│   │   │   ├── courses/            # CourseCard with occupancy bar & CourseFormModal
│   │   │   ├── enrollments/        # Admin EnrollmentTable
│   │   │   ├── layout/             # Top Navbar & RoleGuard
│   │   │   └── ui/                 # Button, Input, Modal, Badge, ConfirmDialog, Toast
│   │   ├── context/                # AuthContext with session hydration & logout
│   │   ├── lib/                    # Typed api client with credentials: 'include'
│   │   └── types/                  # Shared TypeScript interfaces
│   ├── .env.example
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── package.json
└── README.md
```

---

## Key Engineering Highlights

### 1. Concurrency & Transaction Safety
Course enrollments (`POST /api/enrollments`) execute within an atomic Prisma transaction using **row-level locking**:
```sql
SELECT id, capacity FROM "Course" WHERE id = $1 FOR UPDATE
```
This guarantees race-condition immunity against concurrent over-capacity registrations, even during peak registration traffic.

### 2. Privilege Escalation Prevention
User registration (`POST /api/auth/register`) strictly sets `role: STUDENT`. Any `role` field submitted in the client request body is discarded, preventing unauthorized administrative account creation.

### 3. Warm Academic Registrar Aesthetic
A custom editorial design system engineered specifically for higher education:
- **Palette:** Warm Alabaster canvas (`#F9F8F6`), Deep Ink text (`#1C1F26`), Deep Forest Green academic accents (`#1F5E4B`), Soft Sage surfaces (`#EDF4F1`), Warm Ochre low-seat warnings (`#B45309`), and Muted Crimson full-capacity tags (`#B91C1C`).
- **Typography:** `Instrument Serif` for page headings, `Plus Jakarta Sans` for body copy, and `tabular-nums` for all credit counts and seat ratios.
- **Micro-Interactions:** Focus visible rings, accessible modal dialogs, loading skeletons, and subtle toast notifications.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js:** v20+ LTS
- **PostgreSQL:** v14+ (or run the embedded runner via `npm run db:start`)

### 2. Setup & Environment
Clone the repository:
```bash
git clone https://github.com/vnikhitha15-coder/course-register.git
cd course-register
```

Configure environment files:
```bash
# In /backend
cp backend/.env.example backend/.env

# In /frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Database Initialization & Seeding
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
```

### 4. Running the Development Servers
**Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## Seeded Demo Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | Dr. Evelyn Carter | `admin@university.edu` | `Admin@123456` |\
| **Student** | Aarav Sharma | `student1@university.edu` | `Student@123456` |\
| **Student** | Maya Lin | `student2@university.edu` | `Student@123456` |\

*Quick test autofill buttons are also provided directly on the login page for instant sign-in.*

---

## REST API Specification

### Authentication & Identity
- `POST /api/auth/register` — Register student account (forces `STUDENT` role)
- `POST /api/auth/login` — Sign in, issue JWT cookie & token
- `POST /api/auth/logout` — Clear auth cookie
- `GET /api/auth/me` — Retrieve authenticated user profile

### Courses
- `GET /api/courses` — Search & filter course catalog with live seat availability
- `GET /api/courses/:id` — Retrieve course details by UUID

### Student Enrollments (`STUDENT` only)
- `GET /api/enrollments/me` — Enrolled courses with credit hour summary
- `POST /api/enrollments` — Atomic transaction enrollment with row locking
- `DELETE /api/enrollments/:courseId` — Drop course enrollment

### Administration (`ADMIN` only)
- `GET /api/admin/stats` — Live metrics (total courses, students, enrollments, full courses)
- `POST /api/admin/courses` — Create new course
- `PUT /api/admin/courses/:id` — Update course (enforces `capacity >= enrolledCount`)
- `DELETE /api/admin/courses/:id` — Delete course and associated enrollments
- `GET /api/admin/enrollments` — Filter and search all student enrollments
- `DELETE /api/admin/enrollments/:id` — Administratively remove student enrollment

---

## License
MIT
