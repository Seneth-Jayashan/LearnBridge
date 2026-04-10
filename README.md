# 🚀 LearnBridge: LMS & Resource Bridge

## 🌍 Overview

**LearnBridge** is a dual-purpose MERN stack web application built to support **SDG Goal 4: Quality Education**.

It combines:

- 📚 A Learning Management System (LMS)
- 🤝 A Resource Bridge for school donations

Unlike traditional LMS platforms, LearnBridge enables schools to post specific physical resource needs that verified donors can fulfill.

---

## 🛠 Tech Stack

### 💻 Core Stack (MERN)
- MongoDB
- Express.js
- React.js
- Node.js

### 🔌 Third-Party Services

**Communication**
- Zoho Mail (Transactional Emails)
- Text.lk (SMS / OTP Notifications)

**Media & Storage**
- Cloudinary (Lesson materials & profile images)

**Live & AI Integrations**
- Zoom (Live classes)
- Groq (AI capabilities)
- Trivia API (Quiz data)

**Payments**
- PayHere (Secure payment processing)

**Deployment**
- Render (Backend)
- Vercel (Frontend)

---

## 👥 User Roles

### 👑 Super Admin
- Manage all users
- Onboard School Admins
- Manage grades (6–13) and academic levels

### 🏫 School Admin
- Enroll teachers and students
- Verify staff credentials
- Post school resource needs

### 👨‍🏫 Teacher
- Create lessons
- Upload materials (PDF/Image)
- Schedule Zoom classes
- Create MCQ assessments

### 🎓 Student
- Access materials
- Join live classes
- Attempt quizzes with auto-grading
- Track progress and earn badges

### 🤝 Donor
- Browse verified school needs
- Pledge material or financial support
- Prevent duplicate donations via pledge tracking

---

## 🔐 Key Features

### Security Hub
- JWT Authentication
- First-login OTP verification (Email/SMS)
- Mandatory password reset for admin-created accounts

### Low-Bandwidth Mode
- Text-only mode for limited data users
- Optimized for rural connectivity

### Resource Bridge
- Transparent donation registry
- School need verification
- Real-time pledge tracking

### Assessment Engine
- MCQ-based quizzes
- Automatic grading
- Instant feedback

---

## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Seneth-Jayashan/LearnBridge
```

### 2️⃣ Navigate to Apps Directory

```bash
cd LearnBridge/apps
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Configure Environment Variables


# Create .env files inside:

 - apps/api

 - apps/web

```bash
Example:

#server configuration
NODE_ENV=development
PORT=5000

#database configuration
MONGO_URI=mongodb+srv://LearnBridge_DB:
DB_NAME=test

#cors configuration
CORS_ORIGIN=http://localhost:3000

#jwt configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

#bcrypt configuration
BCRYPT_SALT_ROUNDS=10

#zoho email configuration
ZOHO_EMAIL=your_zoho_email_address
ZOHO_ACCOUNT_ID=your_zoho_account_id
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

#payhere configuration
PAYHERE_ENV=sandbox
PAYHERE_MERCHANT_ID=1234567
PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret
PAYHERE_RETURN_URL=http://localhost:3000/payment-success
PAYHERE_CANCEL_URL=http://localhost:3000/payment-cancel
PAYHERE_NOTIFY_URL=http://localhost:5000/api/payments/notify
PAYHERE_CURRENCY=LKR
PAYHERE_API_URL=https://sandbox.payhere.lk/pay/checkout

#sms configuration
SMS_DRIVER=textlk
TEXTLK_API_KEY=your_textlk_api_key
TEXTLK_SENDER_ID="Your Sender ID"
TEXTLK_URL=https://app.text.lk/api/v3/sms/send
```

### 5️⃣ Run Development Server
```bash
npm run dev
```

## 🚀 Project Structure
```bash
LearnBridge/
│
├── apps/
│   ├── api/        # Express Backend
│   └── web/        # React Frontend
│
├── .github/
│   └── workflows/     # Shared utilities (if applicable)
│
└── README.md
```

## 🎯 Mission

 - LearnBridge aims to digitally empower schools while enabling transparent, community-driven resource support — ensuring equitable access to quality education.

## 📄 License

- This project is developed for educational and social impact purposes.

---

## sajana unit test core componentt

### Explain what I tested and why

This project includes unit tests for both backend and frontend core components to reduce regressions and improve release confidence.

Backend (apps/api) tested to validate:

- Controllers: correct HTTP status codes, response shapes, and error handling.
- Middleware: JWT/auth guards, validation flow, and request protection.
- Services: integration wrappers (email, SMS, cloud, live class helpers) with mocked dependencies.
- Validators: strict input validation for safer and cleaner API behavior.

Frontend (apps/web) tested to validate:

- Components: rendering logic, props behavior, and conditional UI states.
- Pages/routes: expected screen output and key user interactions.
- Service/api usage: predictable data handling and UI state transitions.

Why this matters:

- Protects critical user flows across LMS and donation bridge features.
- Finds breaking changes early during development.
- Makes refactoring safer for both API and UI layers.

### Technologies Used

Backend:

- Jest (unit testing + assertions + mocks)

Frontend:

- Vitest (fast test runner for Vite)
- React Testing Library (component behavior testing)

Common:

- npm scripts for standardized execution
- Coverage reporting for test visibility

### Test Structure (Show where your tests are)

Backend test locations:

- `apps/api/tests/controllers/`
- `apps/api/tests/middleware/`
- `apps/api/tests/services/`
- `apps/api/tests/validators/`
- Config: `apps/api/jest.config.js`

Frontend test locations:

- `apps/web/src/test/`
- Config: `apps/web/vitest.config.js`

### How to Run Unit Tests

From repository root:

```bash
cd apps
```

Backend unit tests:

```bash
npm --prefix api test
```

Backend unit tests with coverage:

```bash
npm --prefix api run test -- --coverage
```

Frontend unit tests:

```bash
npm --prefix web test
```

Frontend unit tests with coverage (if configured):

```bash
npm --prefix web run test -- --coverage
```

### Example Test Cases

Backend examples:

- Returns `401` for invalid login credentials.
- Rejects requests with missing/invalid JWT token.
- Fails validation when required lesson/module fields are missing.
- Handles service provider errors gracefully without process crash.

Frontend examples:

- Renders login form fields and submit button.
- Shows validation/error message for invalid input.
- Displays loading and success states correctly after API calls.
- Navigates to expected route after successful action.

### Sample Test Code

Backend sample (Jest):

```javascript
describe("AuthController.login", () => {
	it("returns 401 when credentials are invalid", async () => {
		const req = { body: { email: "wrong@mail.com", password: "badpass" } };
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await AuthController.login(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: false })
		);
	});
});
```

Frontend sample (Vitest + RTL):

```javascript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoginPage from "../pages/LoginPage";

describe("LoginPage", () => {
	it("renders email and password inputs", () => {
		render(<LoginPage />);
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
	});
});
```

### Testing Environment

- OS: Windows (cross-platform compatible with standard Node.js setup)
- Package manager: npm
- Backend runtime: Node.js + Express + Jest
- Frontend runtime: Vite + React + Vitest + React Testing Library
- Backend coverage output: `apps/api/coverage/`