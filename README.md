# LeaveLedger 📋

> A full-stack leave management platform for teams — employees request leave, managers approve it, and everyone stays in sync.


**Live demo → (https://leave-ledger-qwfvlti26-thanushris-projects-c26840ac.vercel.app/login)**

| Demo Account |       Email       | Password |
|--------------|-------------------|----------|
|   Employee   | employee@demo.com | demo1234 |
|   Manager    | manager@demo.com  | demo1234 |

---

## Features

- **Employee dashboard** — view Annual, Sick, and Casual leave balances with used/remaining days
- **Apply for leave** — select type, dates, and reason with real-time balance validation
- **Leave history** — track all past and pending requests with status badges, cancel pending ones
- **Manager approvals** — review, approve, or reject employee leave requests with optional comments
- **Manager dashboard** — see pending approvals count and who is on leave today
- **Team calendar** — visual monthly calendar showing approved team leave
- **Notifications** — in-app bell with unread count for leave updates
- **Role-based access** — employees and managers see completely different interfaces
- **Auto balance deduction** — approved leave automatically deducts from employee balance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |

---

## Quick Start

```bash
git clone https://github.com/Thanushri23/LeaveLedger.git
cd LeaveLedger
npm install
```

Copy the environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the database schema in your Supabase SQL Editor — file is at `supabase/schema.sql`

Start the development server:
```bash
npm run dev
```

Open `http://localhost:3000`

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## Project Structure

```
leaveledger/
├── app/
│   ├── (auth)/          # Login and signup pages
│   ├── (employee)/      # Employee dashboard, apply, history, calendar
│   ├── (manager)/       # Manager dashboard, approvals, calendar
│   └── actions/         # Server actions for auth and leave management
├── components/          # Reusable UI components
├── lib/
│   └── supabase/        # Supabase client (server + client)
├── supabase/
│   └── schema.sql       # Full database schema with RLS policies
├── types/               # TypeScript types
├── middleware.ts         # Auth and role-based route protection
└── .env.example         # Environment variable template
```

---

## Database Schema

Five tables power the application:

- **profiles** — extends Supabase auth with name, role, and department
- **leave_types** — Annual (15d), Sick (10d), Casual (7d) with colors
- **leave_balances** — per-employee balance tracking with auto-calculated remaining days
- **leave_requests** — full leave request lifecycle with status and manager comments
- **notifications** — in-app notifications for leave events

Row Level Security (RLS) is enabled on all tables. Employees can only see their own data. Managers can see all employee data.

---

## How It Works

1. Employee signs up → trigger auto-creates profile and leave balances for the year
2. Employee applies for leave → validated against remaining balance and overlapping dates
3. Manager receives notification and sees request in approvals dashboard
4. Manager approves or rejects with optional comment
5. On approval → leave balance deducted via database RPC function
6. Employee sees updated status and balance on their dashboard

---

## Screenshots

<img width="1440" height="748" alt="image" src="https://github.com/user-attachments/assets/0cdf48ac-d1ca-4fd1-86bb-c37e5bd4ab3a" />
<img width="1440" height="746" alt="image" src="https://github.com/user-attachments/assets/44763c6c-f526-46d2-919e-bcff1802fc15" />

---

## Built For

This project was built as a trial task for the Digital Heroes Full Stack Developer program.

Built by [Thanushri Vundavalli](https://github.com/Thanushri23) · [Portfolio](https://portfolio-sage-three-67.vercel.app) · [LinkedIn](https://www.linkedin.com/in/thanushri-vundavalli/)
