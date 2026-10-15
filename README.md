# MegaNuv Inventory

**MegaNuv Inventory** is a professional Inventory Management application built with **Next.js**, featuring advanced role-based access control, persistent user preferences, and a modern UI.

## 🚀 Version
**Current Version:** *v2.23.0*

## 🚀 Features

* **Role-Based Access Control (RBAC):** Hierarchical permissions for `DIRECTOR`, `ADMIN`, `MANAGER`, and `VIEWER`.
* **Creator Access:** The creator admin can sign into other accounts **without knowing their credentials** (impersonation with an audit trail and a session stash), and can hand the creator title over to another user. **The creator's own password is required on every entry.** No feature flag: it is always active.
* **Theme:** Persistent theme selection (Light, Dark, or System).
* **Inventory Management:** Complete CRUD for items and locations using a nested hierarchy with Father Spaces, Physical Spaces and Actives.
* **Category Management:** Dynamic categories (formerly Areas) with 18 pastel color options, managed via database.
* **Settings & Dashboard:** Complete management for Users, Father Spaces, Categories, and Audit Logs.
* **Audit System:** Global logging of all CRUD operations, logins, and signups with timestamps and user tracking.
* **Secure Authentication:** JWT-based authentication with secure cookie storage and password hashing via Bcrypt.
* **Responsive UI:** Fully responsive dashboard built with Tailwind CSS and Lucide icons, optimized for desktop and mobile.
* **Toast Notifications:** Global feedback system with 4 types (success/error/warning/info).
* **Context Menu:** Right-click actions for quick operations (edit, clone, move, delete) with viewport collision detection.
* **Image Attachment**: Attachment of until 5 images for a active.
* **Attachments on the server:** Up to **5 files per active**, **10 MB** each, restricted to PDF / DOC / DOCX / PNG / JPG / WEBP. Type **and** extension are validated **on the server** (`lib/uploadPolicy.ts`), not only in the browser.
* **QR Code labels:** Per-active QR code labels rendered and printed from the app (`pages/qrcode/view.tsx`).
* **Searchable *Select***: Custom component for Select type Inputs with build-in Search.
* **Custom *Select***: Custom component for Select type Inputs.
* ***`ESC`* Key**: ***`ESC`*** key closes open modals.
* **Clone in Batch**: A function that clones selected actives in batches.
* **Modify Similar Assets**: A checkbox in the Active Update Form that gives the function of modify similar assets (same name, manufacturer, model and sku).
* [<ins>***NEW***</ins>] **Revert Button**: Button that reverts recents changes.
* **Point-in-time Revert:** Time travel on the data itself, powered by MariaDB **system-versioning** (`lib/revert/`), in two modes: `QUICK` (short popup) and `HISTORY` (full history in Settings). `VIEWER` is blocked.
* **Docker Deployment:** `docker build -t inventory .` and `docker run -p 3000:3000 --env-file .env inventory`. The image is multi-stage on the Next.js `output: "standalone"` bundle, runs as a **non-root** user (`node`, uid 1000), and is ~341 MB.
* **Tests:** `yarn test` runs the Vitest suite (`__tests__/`).

---

## 🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (Pages Router, v15)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/) (v6), with **system-versioning** enabled for point-in-time revert
* **Object Storage:** [MinIO](https://min.io) (S3-compatible) for attachments and images
* **Styling:** [Tailwind CSS](https://tailwindcss.com) (v4)
* **Icons:** [Lucide React](https://lucide.dev)
* **Authentication:** JSON Web Tokens (JWT) with jose & BcryptJS
* **Language:** TypeScript (Strict Mode)
* **Testing:** [Vitest](https://vitest.dev) (`yarn test`)
* **Container:** [Docker](https://docker.com) multi-stage image on the Next.js `output: "standalone"` bundle (`Dockerfile`)

---

## Project Characteristic (Don't be afraided)

* **Without `node_modules` in the project *root***: The project uses the next.js option `standalone`, that gives the same use of `node_modules` also the `yarn dev` is configured to use the comands `cd .next/standalone && PORT=3000 HOSTNAME=0.0.0.0 node server.js && cd ../../`, that make the project runs in `.next/standalone` and keep the navegation in terminal to the project root.

## 🏁 Getting Started

### Prerequisites

* Node.js (LTS version)
* [Yarn](https://yarnpkg.com) 1 — **`yarn.lock` is the single source of truth**. `npm install` / `npm ci` are **not** supported and must not be used.
* A running MySQL/MariaDB instance with system-versioning function setted
* A reachable **MinIO** instance — the inventory attachments and images depend on it

---

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Fla175/MegaNuv-Inventory.git
cd inventory
```

2. **Install dependencies:**
```bash
yarn install
```
   
3. **Environment Setup: Create a .env file in the root directory:**
```
DATABASE_URL="mysql://user:pass@localhost:3306/inventory"
JWT_SECRET="your_secret_key_here"
MINIO_ENDPOINT="SEU_HOST_MINIO"
MINIO_ACCESS_KEY="SEU_USUARIO_MINIO"
MINIO_SECRET_KEY="SUA_SENHA_MINIO"
MINIO_PUBLIC_ENDPOINT="SEU_HOST_PUBLICO_MINIO"
```

> **Fail-fast by design:** the application **stops at startup** if any of the variables
> above is missing. `lib/auth.ts` and `lib/minio.ts` validate them with `requireEnv()`,
> which throws at module import — there are no insecure fallbacks with hardcoded
> credentials or production hosts. `.env.example` documents **every** supported
> variable (ports, SSL flags, session and base-URL settings) with comments.

4. **Database Migration:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Run the development server:**
```bash
yarn dev
```

Open [http://0.0.0.0:3000](http://0.0.0.0:3000), [http://localhost:3000](http://localhost:3000) or the **dns / ip** you've setted with your browser to see the result.

> Important: We recommend you to use `nginx` as your **dns server**.

---

## 📂 Project Structure

* **/pages/api/** - Backend routes for all resources (36 endpoints: users, actives, father-spaces, categories, logs, auth, storage, qrcode, revert, creator-access)
* **/pages/settings.tsx** - Complete settings dashboard with tabs for all resources
* **/pages/qrcode/view.tsx** - QR code label rendering and printing for actives
* **/lib/context/** - React Context API for global user state management
* **/lib/apiAuth.ts** - Shared API authentication helper for the `pages/api/**` handlers
* **/lib/revert/** - Point-in-time revert logic (`batch.ts`, `history.ts`, `types.ts`)
* **/lib/uploadPolicy.ts** - Server-side attachment rules (size, MIME type, extension)
* **/types/inventory.ts** - Centralized TypeScript interfaces for the inventory domain
* **/lib/types.ts** - Shared UI component props
* **/prisma/** - Database schema and migration files
* **/components/** - Reusable UI components (*Layout, ListSection, SearchSection, activeForm*)
* **/__tests__/** - Vitest suites (*api, integration, lib*)
* **/scripts/build-optimized.sh** - The optimized build behind `yarn build:opt`
* **/Dockerfile** - Multi-stage image (builder + runner) built on the `standalone` bundle
* **/middleware.ts** - Next.js edge middleware (route protection)

---

## 🛡 User Hierarchy

The system implements a strict permission logic:

* **Directors:** Full control over everything, **including all other users**, settings, logs (can delete/edit), and the total assets value.
* **Admins:** Full control over all users **except *DIRECTOR***, settings, and logs, but **can't see the total assets** (only the aggregated total).
* **Managers:** Can manage *VIEWER* accounts but can't delete or edit *ADMINS* or the *DIRECTOR* user, can view logs, and **can't see the total assets**.
* **Viewers:** Read-only. Can't run any CRUD process, can't access the management tools, and can't see the individual value of actives.
* **Creator Admin:** Full access like an Admin, except the total assets value, and the **only role authorized to use Creator Access** (signing into other accounts). A creator title can be transferred to another user.
* **Owners:** Users can always edit their own profile.

---

## 🧪 Tests & Quality Gates

Every change must pass all of these before being considered done:

```bash
yarn lint            # ESLint — 0 errors, 0 warnings
npx tsc --noEmit     # TypeScript strict — 0 errors
npx prisma validate  # Schema validation
yarn build:opt       # Optimized standalone build
yarn test            # Vitest suite
```

---

> ## Learn More
> To learn more about Next.js, take a look at the following resources:
>
> * [***Next.js Documentation*** - learn about Next.js features and API.](https://nextjs.org/docs)
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)

Have fun!
