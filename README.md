# ⚡ APEX — Enterprise Operations Control Node

APEX is a next-generation, high-performance B2B Multi-Tenant SaaS platform designed to streamline workspace operations. Built for ultimate speed, resource efficiency, and bank-grade security, APEX brings unified telemetry control, offline-first attendance verification, Kanban tasks, and subscription management into a single, cohesive node.

Repository: `theclipperss1-create/APEX`

---

## ✨ Features & Capabilities

### 🏢 B2B Multi-Tenancy & Onboarding
- **Onboarding Pipeline**: Instant tenant registration with custom slug namespaces (e.g., `/sinar-harapan`).
- **Granular Auth & Invitations**: Role-based access control (Admin, Manager, Employee) bound via custom workspace invite codes.

### 📍 Geo-Locked Selfie Attendance
- **Biometric Selfie Verification**: Integrates front-facing cameras with on-the-fly client-side image compression to log present statuses.
- **Real Geolocation Telemetry**: Captures precise browser GPS coordinates on clock-in, mapping logs directly onto Google Maps for supervisor verification.
- **Offline-First Synchronization**: Logs clock-ins locally when connection drops and syncs queue securely when connection restores.

### 📋 Kanban Task Board
- **Status Workflows**: Drag, swap, and track tasks across `Todo`, `In Progress`, `In Review`, and `Done` states.
- **Access Delegation**: Team-wide visibility with restricted modifications reserved for Managers and Administrators.

### 📦 Low-Stock SKU Tracking
- **Inventory Control**: Live stock logging, condition checks, and automated flags for items under critical limits (<= 10 units).

### 💳 Subscription Control & Webhooks
- **Adaptive Pricing Tiers**: Automated limits (15 members on Free, 100 on Pro, Unlimited on Enterprise).
- **Payment Verification**: Generates dynamic invoices, custom QRIS codes, and formats WhatsApp payment links.
- **Automated Webhooks & Cron**: Fail-Closed signature gates for subscription updates and automated cleanup routines.

---

## 🔒 Security Architecture

APEX prioritizes data protection above all else:
- **Row-Level Security (RLS)**: Active across all Supabase PostgreSQL tables. Multi-tenant database queries filter on the database level using `SECURITY DEFINER` constraints, preventing any cross-tenant data leakage.
- **Isomorphic Client Storage Encryption**: Sensitive offline data (GPS coordinates, names, Base64 selfies) written to browser IndexedDB are encrypted on-the-fly using a lightweight isomorphic XOR Base64 cipher derived from the unique Supabase Anon key.
- **Fail-Closed API Gates**: Webhook (`/api/webhooks/whatsapp`) and Cron (`/api/cron/cleanup`) endpoints reject all requests immediately with `401 Unauthorized` if authorization headers or system secrets are unset.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.2 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Storage**: [Supabase PostgreSQL](https://supabase.com/) & [Supabase Storage](https://supabase.com/docs/guides/storage)
- **State Management**: [Zustand v5](https://github.com/pmndrs/zustand)
- **Local Storage DB**: [idb-keyval](https://github.com/jakearchibald/idb-keyval)
- **Animations**: [Framer Motion v12](https://www.framer.com/motion/)
- **Toasts**: [goey-toast](https://github.com/aejkatappaja/goey-toast)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/theclipperss1-create/APEX.git
cd APEX
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-for-admin-bypass

# API Security Keys
WHATSAPP_WEBHOOK_SECRET=your-whatsapp-webhook-secret-signature
CRON_SECRET=your-vercel-cron-secret-signature
```

### 3. Run Locally
Install dependencies and launch the server:
```bash
# Install packages
npm install

# Run the build
npm run build

# Start the lightweight, stable production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📁 Database Schema Setup

Deploy the following schema migration located in [supabase/migrations/20260627000000_initial_schema.sql](file:///c:/Users/HYPE%20AMD/files/belajar%20koding/SaaS%20All/supabase/migrations/20260627000000_initial_schema.sql) directly to your Supabase SQL Editor:
* **companies**: Tenant registry, tier limits (`free`, `pro`, `enterprise`), and active modules list.
* **roles**: Invitation configuration and admin/permissions matrix.
* **users**: Profile logs (distinguishing real accounts from local dummy entries).
* **attendance_logs**: Photo paths, timestamp records, and GPS JSON positions.
* **tasks**: Assignees, titles, descriptions, and workflow states.
* **inventory_assets**: Condition metrics, SKU logs, and quantities.

---

## 🔑 Accessing Super Admin Command Center
To initialize and access the centralized monitoring dashboard:
1. Configure environment variables in `.env`:
   - `SUPER_ADMIN_EMAIL=admin@yourdomain.com`
   - `SUPER_ADMIN_PASSWORD=YourStrongPassword123` (minimum 12 characters, including uppercase, lowercase, and numbers).
2. Execute the one-time bootstrap endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/bootstrap/super-admin
   ```
3. Navigate to `/login` and sign in with your configured administrator credentials to access `/super-admin`.
