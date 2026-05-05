# MegaNuv Inventory

**MegaNuv Inventory** is a professional Inventory Management application built with **Next.js**, featuring advanced role-based access control, persistent user preferences, and a modern UI.

## 🚀 Version
**Current Version:** v2.12.1

## 🚀 Features

* **Role-Based Access Control (RBAC):** Hierarchical permissions for `ADMIN`, `MANAGER`, and `VIEWER`.
* **User Preferences:** Persistent theme selection (Light, Dark, or System) and custom default sorting (Alphabetical or Newest) saved directly to the database.
* **Inventory Management:** Complete CRUD for items and locations using a nested hierarchy with Father Spaces and Physical Spaces.
* **Category Management:** Dynamic categories (formerly Areas) with 18 pastel color options, managed via database.
* **Settings Dashboard:** Complete management for Users, Father Spaces, Categories, and Audit Logs.
* **Audit System:** Global logging of all CRUD operations, logins, and signups with timestamps and user tracking.
* **Secure Authentication:** JWT-based authentication with secure cookie storage and password hashing via Bcrypt.
* **Responsive UI:** Fully responsive dashboard built with Tailwind CSS and Lucide icons, optimized for desktop and mobile.
* **Toast Notifications:** Global feedback system with 4 types (success/error/warning/info).
* **Context Menu:** Right-click actions for quick operations (edit, clone, move, delete) with viewport collision detection.

---

## 🛠 Tech Stack

<<<<<<< HEAD
* **Framework:** [Next.js](https://nextjs.org/) (Pages Router, v15)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/) (v6)
* **Styling:** [Tailwind CSS](https://tailwindcss.com) (v4)
=======
* **Framework:** [Next.js](https://nextjs.org/) (Pages Router)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com)
>>>>>>> origin/main
* **Icons:** [Lucide React](https://lucide.dev)
* **Authentication:** JSON Web Tokens (JWT) with jose & BcryptJS
* **Language:** TypeScript (Strict Mode)

---

## 🏁 Getting Started

### Prerequisites

* Node.js (LTS version)
* Yarn or NPM
* A running MySQL/MariaDB instance

---

### Installation

1. **Clone the repository:**
```bash
git clone <your-repository-url>
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
```

4. **Database Migration:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Run the development server:**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

### 📂 Project Structure

* **/pages/api/** - Backend routes for all resources (users, actives, father-spaces, categories, logs)
* **/pages/settings.tsx** - Complete settings dashboard with tabs for all resources
* **/lib/context/** - React Context API for global user state management
* **/lib/types.ts** - Centralized TypeScript interfaces
* **/prisma/** - Database schema and migration files
* **/components/** - Reusable UI components (Layout, ListSection, SearchSection, activeForm)

---

### 🛡 API Hierarchy & Security

The system implements a strict permission logic:

<<<<<<< HEAD
* **Admins:** Full control over all users, settings, and can delete/edit logs.
* **Managers:** Can manage VIEWER accounts but cannot delete or edit ADMINS, can view logs.
* **Viewers:** Users that only can look the inventory, but can't do any process.
* **Owners:** Users can always edit their own profile or delete their own account.

---

## 📝 Recent Changes (v2.11.1)

### Bug Fixes
- Fixed hydration errors with dynamic version and client-side BUILD_DATE
- Fixed empty states for categories and father spaces
- Fixed cascade delete for father spaces
- Fixed serial numbers update in edit form
- Fixed isPhysicalSpace field update

### Improvements
- Complete responsiveness for settings page (optimized for narrow screens)
- Enhanced footer UI in Layout component
- Better truncation for user names
- Responsive grid for category cards (2 columns mobile, 3-4 desktop)
=======
* **Admins:** Full control over all users and settings.

* **Managers:** Can manage VIEWER accounts but cannot delete or edit ADMINS.

* **Owners:** Users can always edit their own profile or delete their own account.

* **Viewers:** Users that only can look the inventory, but can't do any process.
>>>>>>> origin/main

---

> ## Learn More
> To learn more about Next.js, take a look at the following resources:
>
> * [***Next.js Documentation*** - learn about Next.js features and API.](https://nextjs.org/docs)
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)
<<<<<<< HEAD
=======
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)
>>>>>>> origin/main
