# MegaNuv Inventory

**MegaNuv Inventory** is a professional Inventory Management application built with **Next.js**, featuring advanced role-based access control, persistent user preferences, and a modern UI.

## 🚀 Version
**Current Version:** *v2.18.2*

## 🚀 Features

* **Role-Based Access Control (RBAC):** Hierarchical permissions for `DIRECTOR`, `ADMIN`, `MANAGER`, and `VIEWER`.
* **Theme:** Persistent theme selection (Light, Dark, or System).
* **Inventory Management:** Complete CRUD for items and locations using a nested hierarchy with Father Spaces, Physical Spaces and Actives.
* **Category Management:** Dynamic categories (formerly Areas) with 18 pastel color options, managed via database.
* **Settings & Dashboard:** Complete management for Users, Father Spaces, Categories, and Audit Logs.
* **Audit System:** Global logging of all CRUD operations, logins, and signups with timestamps and user tracking.
* **Secure Authentication:** JWT-based authentication with secure cookie storage and password hashing via Bcrypt.
* **Responsive UI:** Fully responsive dashboard built with Tailwind CSS and Lucide icons, optimized for desktop and mobile.
* **Toast Notifications:** Global feedback system with 4 types (success/error/warning/info).
* **Context Menu:** Right-click actions for quick operations (edit, clone, move, delete) with viewport collision detection.
* **Image attachment**: Attachment of until 5 images for a active.
* **Searchable *Select***: Custom component for Select type Inputs with build-in Search.
* **Custom *Select***: Custom component for Select type Inputs.
* [<ins>***NEW***</ins>] ***`ESC`* Key**: ***`ESC`*** key closes open modals.

---

## 🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (Pages Router, v15)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/) (v6)
* **Styling:** [Tailwind CSS](https://tailwindcss.com) (v4)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/)
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

Open [http://localhost:3000](http://localhost:3000) (or the **dns / ip** you've setted) with your browser to see the result.

---

## 📂 Project Structure

* **/pages/api/** - Backend routes for all resources (users, actives, father-spaces, categories, logs)
* **/pages/settings.tsx** - Complete settings dashboard with tabs for all resources
* **/lib/context/** - React Context API for global user state management
* **/lib/types.ts** - Centralized TypeScript interfaces
* **/prisma/** - Database schema and migration files
* **/components/** - Reusable UI components (*Layout, ListSection, SearchSection, activeForm*)

---

## 🛡 User Hierarchy

The system implements a strict permission logic:

* **Director:** Full control over all users, settings, and can delete/edit logs.
* **Admins:** Full control over all users except *DIRECTOR*, settings, and can delete/edit logs, but can't see the total assets.
* **Managers:** Can manage *VIEWER* accounts but can't delete or edit *ADMINS* or the *DIRECTOR* user, can view logs, and can't see the total assets.
* **Viewers:** Users that only can look the inventory, can't do any process, and can't see the individual value of actives.
* **Owners:** Users can always edit their own profile.

---

> ## Learn More
> To learn more about Next.js, take a look at the following resources:
>
> * [***Next.js Documentation*** - learn about Next.js features and API.](https://nextjs.org/docs)
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)

