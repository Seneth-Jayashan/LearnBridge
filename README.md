# LearnBridge: LMS & Resource Bridge

## 🚀 Project Overview
[cite_start]**LearnBridge** is a dual-purpose MERN stack web application built to address **SDG Goal 4: Quality Education**[cite: 1, 3]. [cite_start]It bridges the gap in under-resourced schools by providing a unified platform for **digital learning** and **physical resource procurement**[cite: 6]. 

[cite_start]Unlike standard Learning Management Systems, LearnBridge includes a unique **"Resource Bridge"** that allows schools to list specific needs which can be fulfilled by registered donors[cite: 7].

---

## 🛠 Tech Stack & Third-Party Services
[cite_start]The application is built using the **MERN Stack** (MongoDB, Express, React, Node.js) [cite: 2] and integrates several professional services:

* **Communication:** **Zoho Mail** (Transitional emails) and **Text.lk** (SMS/OTP notifications).
* [cite_start]**Media & Storage:** **Cloudinary** (Lesson materials and profile images)[cite: 26, 53].
* **Integrations:** **Zoom** (Live classes), **Groq** (AI capabilities), **Trivia** (Quiz data), and **PayHere** (Payment processing).
* [cite_start]**Deployment:** **Render** (Backend) and **Vercel** (Frontend)[cite: 50, 51].

---

## 👥 User Roles & Responsibilities
[cite_start]The system implements Role-Based Access Control (RBAC) across five distinct actors[cite: 9]:



### **Super Admin**
* Add and manage any user type within the system.
* Onboard School Admins and link them to specific schools.
* Manage core system modules, Grades (6-13), and academic Levels.

### **School Admin**
* Enroll Students and Teachers specifically belonging to their school.
* [cite_start]Manage and verify the credentials of school staff[cite: 13, 20].
* [cite_start]Identify and post "School Resource Needs" to the donation feed[cite: 11, 37].

### **Teacher**
* [cite_start]Register as a standalone educator or as part of a verified school[cite: 19].
* [cite_start]Create lessons, upload materials (PDFs/Images), and schedule **Zoom** classes[cite: 11, 24, 25].
* [cite_start]Design assessments and MCQs using the Quiz Engine[cite: 31].

### **Student**
* [cite_start]Access educational materials and join live Zoom sessions[cite: 10].
* [cite_start]Participate in quizzes with instant auto-grading feedback[cite: 10, 32].
* [cite_start]Track personal learning progress and earn virtual badges[cite: 33, 34].

### **Donor**
* [cite_start]Browse verified school needs (books, stationery, devices)[cite: 7, 38].
* [cite_start]Pledge material or financial support to specific schools[cite: 12, 39].

---

## 📦 Key Features

* [cite_start]**Security Hub:** Secure JWT authentication with a **First-Login OTP flow** (Email/SMS) and mandatory password resets for admin-created accounts[cite: 17].
* [cite_start]**Low-Bandwidth Mode:** A specialized toggle that strips high-res media to serve text-only content for students with limited data[cite: 27].
* [cite_start]**Resource Bridge:** A transparent registry of school needs where donors can "Pledge" items to prevent duplicate donations[cite: 37, 39, 40].
* [cite_start]**Assessment Engine:** Teachers create MCQs that the system automatically grades, providing instant outcomes[cite: 31, 32].

---

## 🔧 Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Seneth-Jayashan/LearnBridge](https://github.com/Seneth-Jayashan/LearnBridge)
    ```
2.  **Navigate to the Apps folder:**
    ```bash
    cd LearnBridge/apps
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Variables:**
    Configure your `.env` files in both the `api` and `web` directories with your credentials for MongoDB, Zoho, Text.lk, and Cloudinary.
5.  **Run Development Mode:**
    ```bash
    npm run dev
    ```