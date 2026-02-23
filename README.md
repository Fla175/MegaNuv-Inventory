# MegaNuv Inventory

**MegaNuv Inventory** is a professional Inventory Management application built with **Next.js**, featuring advanced role-based access control, persistent user preferences, and a modern UI.

---

## 🚀 Features

* **Role-Based Access Control (RBAC):** Hierarchical permissions for `ADMIN`, `MANAGER`, and `VIEWER`.
* **User Preferences:** Persistent theme selection (Light, Dark, or System) and custom default sorting (Alphabetical or Newest) saved directly to the database.
* **Inventory Management:** Complete CRUD for items and locations using a nested hierarchy.
* **Secure Authentication:** JWT-based authentication with secure cookie storage and password hashing via Bcrypt.
* **Responsive UI:** Fully responsive dashboard built with Tailwind CSS and Lucide icons.

---

## 🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (Pages Router)
* **Database:** [MariaDB](https://mariadb.org) with [Prisma ORM](https://www.prisma.io/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com)
* **Icons:** [Lucide React](https://lucide.dev)
* **Authentication:** JSON Web Tokens (JWT) & BcryptJS

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
DATABASE_URL="mysql://root:password@localhost:3306/inventory"
JWT_SECRET="your_secret_key_here"
```

4. Database Migration:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

### 📂 Project Structure
* **/pages/api/users/** - Backend routes for user management and preferences.

* **/lib/context/** - React Context API for global user state management.

* **/prisma/** - Database schema and migration files.

* **/components/** - Reusable UI components and Layout.

---

### 🛡 API Hierarchy & Security
The system implements a strict permission logic:

* **Admins:** Full control over all users and settings.

* **Managers:** Can manage VIEWER accounts but cannot delete or edit ADMINS.

* **Owners:** Users can always edit their own profile or delete their own account.

* **Viewers:** Users that only can look the inventory, but can't do any process.

---

> ## Learn More
> To learn more about Next.js, take a look at the following resources:
>
> * [***Next.js Documentation*** - learn about Next.js features and API.](https://nextjs.org/docs)
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)
>
> * [***Learn Next.js*** - an interactive Next.js tutorial.](https://nextjs.org/learn/dashboard-app)
