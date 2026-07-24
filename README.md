# Smart Canteen Ordering System

**Live Demo:** [https://smartcanteen.arulselvan.dev/](https://smartcanteen.arulselvan.dev/)

A secure, high-fidelity full-stack Smart Canteen Ordering & Token Management System. Designed for university and corporate canteens, it features role-based dashboards, automated token generation, live kitchen display screens, real-time tracking, and **production-grade secure payment gateway architectures**.

---

## 🌟 Core Features

### 1. 👥 Multi-Role Dashboard Ecosystem
* **Student / Customer Portal**: Elegant menu browsing, cart management, active order tracking, and token balance monitoring.
* **Kitchen Staff Monitor**: Real-time incoming order queues, active preparation state managers, and instant token ready-status triggers.
* **Manager Terminal**: Overview of daily statistics, canteen metrics, order lines, and active staff lists.
* **Admin Control Center**: Full terminal to configure system settings, update menu items, authorize registers, inspect detailed audit logs, and manage payment configurations.

### 2. ⚡ Real-Time Tracking & Notifications
* Live order status tracker (from received to preparing, ready, and picked up).
* Digital QR Code and numeric Token Generation for secure and contactless food pickup.
* Audio cues and live digital board displaying completed token queues.

### 3. 🛡️ Secure Payment Architecture
To protect sensitive credentials when the project is shared, published on **GitHub**, or hosted on cloud platforms (such as **Vercel** or **Render**), the payment configuration relies on a hardened server-client proxy architecture:
* **Zero Client Exposure**: Unlike insecure client-side apps, sensitive secrets like the `STRIPE_SECRET_KEY` and `PAYPAL_CLIENT_ID` are **never** bundled into the client-side JavaScript bundle. They remain strictly on the Express backend.
* **Server-Side Storage**: Payment gateway credentials are saved securely in an isolated server directory (`server/gateway-config.json`) which is protected and listed in `.gitignore`.
* **Credential Masking**: The configuration API (`/api/gateway/config`) automatically strips and masks private credentials (returning only partial prefixes like `sk_test_••••••••2026`) before sending metadata to the browser dashboard.
* **Secure Environment Overrides**: In production environments, administrators can supply `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, and `PAYPAL_CLIENT_ID` directly via secure environment variables in their hosting provider's dashboard, completely bypassing file system storage.

---

## 🛠️ Security & Safe Hosting Checklist

If you are planning to push this repository to **GitHub** or deploy it to a hosting service (e.g., **Vercel**, **Netlify**, **Render**, **Railway**), follow these critical safety measures to keep your account safe from unauthorized charges:

### 1. Ensure `.env` is Ignored
Before making your first commit, verify that `.gitignore` contains the following lines so you never accidentally commit your private keys:
```text
.env
.env.local
server/gateway-config.json
```

### 2. Configure Host Environment Variables
When hosting, never hardcode keys in your code files. Instead, set them within your hosting provider's project settings panel:

| Environment Variable | Description | Example Value |
| :--- | :--- | :--- |
| `STRIPE_PUBLIC_KEY` | Public client-facing key (Safe for client routing) | `pk_test_51Nx8O9HnG8R34...` |
| `STRIPE_SECRET_KEY` | Private key (Used purely server-side) | `sk_test_51Nx8O9HnG8R34...` |
| `PAYPAL_CLIENT_ID` | PayPal Merchant client identifier | `client_sandbox_88x991aa_pp` |

### 3. Stick to Test Mode (Sandbox)
Always use your **Stripe Test Mode** (`pk_test_...` and `sk_test_...`) keys. Do not plug in Live Production credentials for school or portfolio demonstration projects.

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd smart-canteen
   ```

2. Install the workspace dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and populate it with your respective sandbox credentials.

### Running the Application

To boot both the **Express secure API server** and the high-performance **Vite frontend development server**:
```bash
npm run dev
```
The server will bind to `http://localhost:3000` (handling API requests under `/api/*` and serving hot-reloaded frontend assets automatically).

### Building for Production

Compile a production-optimized static client and a self-contained Node backend:
```bash
npm run build
npm run start
```
The production bundle will compile into the `/dist` directory, completely resolving relative ES module paths to prevent bundle leak.
