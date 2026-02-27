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

### 2️⃣ Navigate to Apps Directory

```bash
cd LearnBridge/apps

### 3️⃣ Install Dependencies

```bash
npm install

### 4️⃣ Configure Environment Variables


# Create .env files inside:

 - apps/api

 - apps/web

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

### 5️⃣ Run Development Server
```bash
npm run dev

## 🚀 Project Structure
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

## 🎯 Mission

 - LearnBridge aims to digitally empower schools while enabling transparent, community-driven resource support — ensuring equitable access to quality education.

## 📄 License

- This project is developed for educational and social impact purposes.