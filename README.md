# LearnBridge

LearnBridge is a dual-purpose MERN platform that combines:

- Learning Management System workflows for schools
- Donation and resource-bridge workflows for verified school needs

The project supports SDG Goal 4 (Quality Education) and is designed for low-bandwidth contexts.

## Deployment

- Backend hosting: Railway
- Frontend hosting: Vercel
- Domain: https://uniprojects.stie

Recommended production mapping:

- Frontend app: https://uniprojects.stie
- API base URL: set in frontend environment as the Railway backend URL

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MongoDB
- Auth: JWT + refresh token cookie
- Storage: Cloudinary
- Email/SMS: Zoho Mail, Text.lk
- Live classes: Zoom
- AI: Groq
- Payments: PayHere

## User Roles

- super_admin
- school_admin
- teacher
- student
- donor

## Repository Structure

- apps/api: backend service
- apps/web: frontend app
- apps/package.json: mono scripts for running both services

## Local Development

From apps:

1. Install dependencies
	 npm install

2. Run backend and frontend together
	 npm run dev

3. Run only backend
	 npm run api

4. Run only frontend
	 npm run web

Backend default API prefix:

- /api/v1

## Environment Notes

Backend expects values similar to:

- NODE_ENV
- PORT
- MONGO_URI or equivalent DB config values
- JWT_SECRET
- CORS_ORIGIN
- FRONTEND_URL
- BACKEND_URL
- PAYHERE_MERCHANT_ID
- PAYHERE_MERCHANT_SECRET
- PAYHERE_CURRENCY
- PAYHERE_RETURN_URL
- PAYHERE_CANCEL_URL
- PAYHERE_NOTIFY_URL
- GROQ_API_KEY

## Authentication and Authorization

Protected routes require:

- Header: Authorization: Bearer <access_token>

Role restrictions are enforced by route middleware.

Refresh flow:

- Refresh token is stored in cookie (refreshToken)
- Access token is returned from login, setup-new-password, and refresh

## Common Response Format

Most routes return one of these shapes:

Success examples:

{
	"message": "Operation completed",
	"data": {}
}

or

{
	"message": "Operation completed",
	"resource": { }
}

Validation error (Zod):

{
	"message": "Validation Error",
	"errors": [
		{ "field": "fieldName", "message": "error message" }
	]
}

Auth errors:

{
	"message": "Not authorized, no token provided"
}

{
	"message": "You do not have permission to perform this action"
}

## Full API Endpoint Reference

Base URL:

- Production: Railway backend URL
- Local: http://localhost:5000/api/v1

### System

1. GET /
- Auth: public
- Request body: none
- Success 200:
	{
		"message": "LearnBridge API is running secure & fast!"
	}

2. GET /api/v1/health
- Auth: public
- Request body: none
- Success 200:
	{
		"status": "ok",
		"uptime": 123.45,
		"timestamp": "2026-04-11T00:00:00.000Z"
	}

### Auth Routes (/api/v1/auth)

1. POST /auth/login
- Auth: public
- Request:
	{
		"identifier": "email_or_phone_or_student_reg",
		"password": "string"
	}
- Success 200 normal login:
	{
		"message": "Login successful",
		"accessToken": "jwt",
		"user": {
			"id": "userId",
			"firstName": "A",
			"lastName": "B",
			"role": "student",
			"regNumber": "STU0001",
			"school": "schoolId",
			"isSchoolVerified": true
		}
	}
- Success 200 first-login flow:
	{
		"message": "First login detected. OTP sent to your email and phone.",
		"requiresOtpVerification": true,
		"userId": "userId"
	}

2. POST /auth/verify-first-login-otp
- Auth: public
- Request:
	{
		"userId": "userId",
		"otp": "123456"
	}
- Success 200:
	{
		"message": "OTP verified successfully. Please enter your new password.",
		"resetToken": "jwt"
	}

3. POST /auth/setup-new-password
- Auth: public
- Request:
	{
		"resetToken": "jwt",
		"newPassword": "newSecret"
	}
- Success 200:
	{
		"message": "Password updated successfully. Welcome to your dashboard!",
		"accessToken": "jwt",
		"user": {
			"id": "userId",
			"firstName": "A",
			"lastName": "B",
			"role": "teacher"
		}
	}

4. POST /auth/refresh
- Auth: cookie refreshToken
- Request body: none
- Success 200:
	{
		"accessToken": "jwt"
	}

5. POST /auth/forgot-password
- Auth: public
- Request:
	{
		"identifier": "email_or_phone_or_student_reg"
	}
- Success 200:
	{
		"message": "OTP sent.",
		"success": true
	}

6. POST /auth/reset-password
- Auth: public
- Request:
	{
		"identifier": "email_or_phone_or_student_reg",
		"otp": "123456",
		"newPassword": "newSecret"
	}
- Success 200:
	{
		"message": "Password reset successfully",
		"success": true
	}

7. POST /auth/logout
- Auth: protected
- Request body: none
- Success 200:
	{
		"message": "Logged out successfully."
	}

8. GET /auth/me
- Auth: protected
- Request body: none
- Success 200:
	{
		"user": {
			"_id": "userId",
			"firstName": "A",
			"lastName": "B",
			"role": "student",
			"grade": { "_id": "gradeId", "name": "10" },
			"school": { "_id": "schoolId", "name": "School" }
		}
	}

### User Routes (/api/v1/users)

1. GET /users/schools
- Auth: public
- Request body: none
- Success 200: array of verified active schools

2. POST /users/register-donor
- Auth: public
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "donor@mail.com",
		"phoneNumber": "0770000000",
		"password": "secret123",
		"address": {
			"street": "x",
			"city": "y",
			"state": "z",
			"zipCode": "10100",
			"country": "Sri Lanka"
		}
	}
- Success 201:
	{
		"message": "Donor profile created successfully",
		"userId": "userId"
	}

3. POST /users/register-teacher
- Auth: public
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "teacher@mail.com",
		"phoneNumber": "0770000000",
		"password": "secret123",
		"schoolId": "optionalSchoolId"
	}
- Success 201:
	{
		"message": "Teacher registered. Awaiting School Admin verification."
	}
	or
	{
		"message": "Standalone Teacher registered successfully."
	}

4. POST /users/restore
- Auth: public
- Request:
	{
		"identifier": "email_or_phone_or_reg"
	}
- Success 200:
	{
		"message": "Profile restored successfully"
	}

5. PUT /users/profile
- Auth: protected
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "new@mail.com",
		"phoneNumber": "0771111111",
		"address": {
			"street": "new"
		}
	}
- Success 200:
	{
		"message": "Profile updated successfully",
		"user": {
			"id": "userId",
			"firstName": "A"
		}
	}

6. PUT /users/update-password
- Auth: protected
- Request:
	{
		"currentPassword": "old",
		"newPassword": "newSecret"
	}
- Success 200:
	{
		"message": "Password updated successfully"
	}

7. DELETE /users/profile
- Auth: protected
- Request body: none
- Success 200:
	{
		"message": "Profile deleted successfully"
	}

### Super Admin Routes (/api/v1/admin)

School management

1. POST /admin/create-school
- Auth: protected, role super_admin
- Request:
	{
		"schoolData": {
			"name": "School Name",
			"contactEmail": "school@mail.com",
			"contactPhone": "0110000000",
			"address": {
				"street": "x",
				"city": "y"
			}
		},
		"adminData": {
			"firstName": "Admin",
			"lastName": "One",
			"email": "admin@mail.com",
			"phoneNumber": "0770000000",
			"password": "secret123"
		}
	}
- Success 201:
	{
		"message": "School and Admin created successfully",
		"school": { "_id": "schoolId", "name": "School Name" },
		"adminId": "userId"
	}

2. GET /admin/schools
- Auth: protected, role super_admin
- Success 200: array of schools

3. GET /admin/schools/:id
- Auth: protected, role super_admin
- Success 200: school with admins, teachers, students

4. PUT /admin/schools/:id
- Auth: protected, role super_admin
- Content-Type: multipart/form-data or json
- Request fields: name, contactEmail, contactPhone, isActive, logo file or logoUrl, address
- Success 200:
	{
		"message": "School updated successfully",
		"school": { }
	}

5. DELETE /admin/schools/:id
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "School deleted successfully"
	}

User management

6. POST /admin/create-user
- Auth: protected, role super_admin
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "user@mail.com",
		"phoneNumber": "0770000000",
		"password": "secret123",
		"role": "student",
		"grade": "gradeId",
		"level": "levelId",
		"stream": "Mathematics Stream",
		"address": { }
	}
- Success 201:
	{
		"message": "User created successfully",
		"userId": "userId"
	}

7. GET /admin/users
- Auth: protected, role super_admin
- Success 200: array of users

8. GET /admin/users/:id
- Auth: protected, role super_admin
- Success 200: user object

9. PUT /admin/users/:id
- Auth: protected, role super_admin
- Request: any updatable user fields
- Success 200:
	{
		"message": "User updated successfully",
		"user": { }
	}

10. DELETE /admin/users/:id
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "User deleted successfully"
	}

11. PATCH /admin/users/:id/toggle-status
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "User activated successfully"
	}
	or
	{
		"message": "User deactivated successfully"
	}

12. PATCH /admin/users/:id/toggle-lock
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "User locked successfully"
	}
	or
	{
		"message": "User unlocked successfully"
	}

13. PATCH /admin/users/:id/restore
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "User restored successfully"
	}

Utility

14. POST /admin/check-phone
- Auth: protected, role super_admin
- Request:
	{
		"phoneNumber": "0770000000"
	}
- Success 200:
	{
		"exists": true,
		"count": 1
	}

15. POST /admin/check-email
- Auth: protected, role super_admin
- Request:
	{
		"email": "user@mail.com"
	}
- Success 200:
	{
		"exists": true,
		"count": 1
	}

### School Admin Routes (/api/v1/school-admin)

1. GET /school-admin/my-school
- Auth: protected, role school_admin
- Success 200: school details with user lists

2. PUT /school-admin/my-school
- Auth: protected, role school_admin
- Content-Type: multipart/form-data or json
- Request fields: contactEmail, contactPhone, logo file or logoUrl, address
- Success 200:
	{
		"message": "School profile updated successfully",
		"school": { }
	}

Student management

3. GET /school-admin/students
- Auth: protected, role school_admin
- Success 200: array of students

4. POST /school-admin/students
- Auth: protected, role school_admin
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "optional@mail.com",
		"phoneNumber": "0770000000",
		"password": "secret123",
		"grade": "gradeId",
		"level": "levelId",
		"stream": "Biology Stream",
		"address": { }
	}
- Success 201:
	{
		"message": "Student created successfully",
		"studentRegNumber": "STU0001",
		"studentId": "userId"
	}

5. PUT /school-admin/students/:studentId
- Auth: protected, role school_admin
- Request: student profile fields
- Success 200:
	{
		"message": "Student updated successfully"
	}

6. PATCH /school-admin/students/:studentId/deactivate
- Auth: protected, role school_admin
- Success 200:
	{
		"message": "Student deactivated successfully."
	}

Teacher management

7. POST /school-admin/teachers
- Auth: protected, role school_admin
- Request:
	{
		"firstName": "A",
		"lastName": "B",
		"email": "teacher@mail.com",
		"phoneNumber": "0770000000",
		"password": "secret123",
		"schoolId": "optional"
	}
- Success 201:
	{
		"message": "Teacher registered successfully."
	}

8. GET /school-admin/teachers
- Auth: protected, role school_admin
- Success 200: verified teachers list

9. GET /school-admin/teachers/pending
- Auth: protected, role school_admin
- Success 200: pending teachers list

10. PATCH /school-admin/teachers/:teacherId/verify
- Auth: protected, role school_admin
- Success 200:
	{
		"message": "Teacher verified successfully."
	}

11. DELETE /school-admin/teachers/:teacherId/remove
- Auth: protected, role school_admin
- Success 200:
	{
		"message": "Teacher removed from school successfully. They are now a standalone teacher."
	}

Needs registry

12. POST /school-admin/needs
- Auth: protected, role school_admin
- Request:
	{
		"itemName": "Books",
		"quantity": 100,
		"amount": 25000,
		"description": "Grade 10 science books",
		"urgency": "High"
	}
- Success 201:
	{
		"message": "Need posted successfully",
		"need": { }
	}

13. GET /school-admin/school/my-needs
- Auth: protected, role school_admin
- Success 200: array of posted needs

14. PUT /school-admin/school/:id
- Auth: protected, role school_admin
- Request: itemName, quantity, amount, description, urgency
- Success 200:
	{
		"message": "Need updated successfully",
		"need": { }
	}

15. DELETE /school-admin/school/:id
- Auth: protected, role school_admin
- Success 200:
	{
		"message": "Need deleted successfully"
	}

16. GET /school-admin/needs/donor/:needId
- Auth: protected, role school_admin
- Success 200:
	{
		"donor": {
			"firstName": "A",
			"lastName": "B",
			"email": "donor@mail.com",
			"phoneNumber": "0770000000"
		},
		"need": {
			"itemName": "Books",
			"quantity": 100,
			"amount": 25000,
			"status": "Pledged",
			"paymentStatus": "Completed"
		}
	}

### Donor Routes (/api/v1/donor)

1. GET /donor/profile
- Auth: protected, role donor
- Success 200: current donor user object

2. PUT /donor/profile
- Auth: protected, role donor
- Request: profile fields
- Success 200:
	{
		"message": "Profile updated successfully",
		"user": { }
	}

3. PUT /donor/profile/change-password
- Auth: protected, role donor
- Request:
	{
		"currentPassword": "old",
		"newPassword": "new"
	}
- Success 200:
	{
		"message": "Password updated successfully"
	}

4. GET /donor/my
- Auth: protected, role donor
- Success 200: array of donor pledged needs

5. GET /donor/overview
- Auth: protected, role donor
- Success 200:
	{
		"total": 10,
		"pending": 3,
		"fulfilled": 7,
		"totalItems": 120,
		"schoolsSupported": 5,
		"recentDonations": [ ],
		"urgentNeeds": [ ]
	}

6. GET /donor/impact
- Auth: protected, role donor
- Success 200:
	{
		"totalItemsDonated": 120,
		"totalSchoolsSupported": 5,
		"mostDonatedItem": "Books",
		"thisMonthItems": 20,
		"thisMonthSchools": 2,
		"log": [ ]
	}

7. GET /donor/
- Auth: protected, role donor
- Query params optional: urgency, status, search
- Success 200: array of needs

8. PUT /donor/:id/pledge
- Auth: protected, role donor
- Request body: none
- Success 200:
	{
		"message": "Pledge successful",
		"need": { }
	}

9. PUT /donor/:id/complete
- Auth: protected, role donor
- Request body: none
- Success 200:
	{
		"message": "Marked as fulfilled",
		"need": { }
	}

### Payment Routes (/api/v1/payments)

1. POST /payments/initiate/:needId
- Auth: protected, role donor
- Request body: none
- Success 200:
	{
		"sandbox": true,
		"merchant_id": "...",
		"return_url": "...",
		"cancel_url": "...",
		"notify_url": "...",
		"order_id": "ORDER_need_timestamp",
		"items": "Books",
		"amount": "25000.00",
		"currency": "LKR",
		"hash": "...",
		"first_name": "A",
		"last_name": "B",
		"email": "donor@mail.com",
		"phone": "0770000000",
		"address": "Street",
		"city": "City",
		"country": "Sri Lanka",
		"custom_1": "needId",
		"custom_2": "donorId"
	}

2. POST /payments/notify
- Auth: public (PayHere callback)
- Request: PayHere callback fields
- Success 200: plain text OK

3. POST /payments/confirm
- Auth: protected, role donor
- Request:
	{
		"orderId": "ORDER_need_timestamp",
		"needId": "needId"
	}
- Success 200:
	{
		"message": "Payment confirmed, need fulfilled!",
		"need": { }
	}

4. GET /payments/my-history
- Auth: protected, role donor
- Success 200: array of payment records

5. PUT /payments/reset/:needId
- Auth: protected
- Request body: none
- Success 200:
	{
		"message": "Reset successful"
	}

### Levels Routes (/api/v1/levels)

1. POST /levels/seed-defaults
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "Default levels synced successfully",
		"created": 0,
		"updated": 4
	}

2. POST /levels/
- Auth: protected, role super_admin
- Request:
	{
		"name": "Advanced Level",
		"description": "Grade 12-13"
	}
- Success 201:
	{
		"message": "Level created successfully",
		"level": { }
	}

3. GET /levels/
- Auth: protected
- Success 200: array of levels

4. GET /levels/:id
- Auth: protected
- Success 200: level

5. PUT /levels/:id
- Auth: protected, role super_admin
- Request: name, description
- Success 200:
	{
		"message": "Level updated successfully",
		"level": { }
	}

6. DELETE /levels/:id
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "Level deleted successfully"
	}

### Grades Routes (/api/v1/grades)

1. POST /grades/seed-defaults
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "Default grades synced successfully",
		"created": 0,
		"updated": 13
	}

2. POST /grades/
- Auth: protected, role super_admin
- Request:
	{
		"name": "10",
		"description": "Grade 10"
	}
- Success 201:
	{
		"message": "Grade created successfully",
		"grade": { }
	}

3. GET /grades/
- Auth: protected
- Success 200: array of grades

4. GET /grades/:id
- Auth: protected
- Success 200: grade

5. PUT /grades/:id
- Auth: protected, role super_admin
- Request: name, description
- Success 200:
	{
		"message": "Grade updated successfully",
		"grade": { }
	}

6. DELETE /grades/:id
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "Grade deleted successfully"
	}

### Modules Routes (/api/v1/modules)

1. GET /modules/
- Auth: protected
- Query optional: q, grade, level
- Success 200: array of modules

2. GET /modules/:id
- Auth: protected
- Success 200: module object

3. POST /modules/
- Auth: protected, role super_admin
- Content-Type: multipart/form-data or json
- Request:
	{
		"name": "Physics",
		"description": "Module",
		"thumbnailUrl": "optional",
		"level": "levelId",
		"grade": "gradeId",
		"subjectStream": "Mathematics Stream"
	}
- Success 201:
	{
		"message": "Module created successfully",
		"module": { }
	}

4. PUT /modules/:id
- Auth: protected, role super_admin
- Request fields same as create (partial)
- Success 200:
	{
		"message": "Module updated successfully",
		"module": { }
	}

5. DELETE /modules/:id
- Auth: protected, role super_admin
- Success 200:
	{
		"message": "Module deleted successfully",
		"deletedLessons": 0,
		"deletedAssignments": 0,
		"deletedAssignmentSubmissions": 0
	}

### Lessons Routes (/api/v1/lessons)

1. POST /lessons/
- Auth: protected, roles teacher or school_admin or super_admin
- Content-Type: multipart/form-data or json
- Request:
	{
		"title": "Lesson 1",
		"description": "Intro",
		"module": "moduleId",
		"materialUrl": "optional",
		"videoUrl": "optional",
		"createZoomMeeting": true,
		"zoomStartTime": "2026-04-20T10:00:00.000Z"
	}
- Success 201:
	{
		"message": "Lesson created successfully",
		"lesson": { },
		"onlineMeeting": { }
	}

2. GET /lessons/
- Auth: protected
- Query optional: module, q, grade
- Success 200: array of lessons

3. GET /lessons/:id
- Auth: protected
- Success 200: lesson

4. GET /lessons/:id/material-download
- Auth: protected
- Success 200:
	{
		"downloadUrl": "signedUrl",
		"fileName": "file.pdf"
	}

5. GET /lessons/:id/video-download
- Auth: protected
- Success 200:
	{
		"downloadUrl": "videoUrl",
		"fileName": "video.mp4"
	}

6. PUT /lessons/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Request: partial create fields
- Success 200:
	{
		"message": "Lesson updated successfully",
		"lesson": { }
	}

7. DELETE /lessons/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Success 200:
	{
		"message": "Lesson deleted successfully"
	}

### Assignments Routes (/api/v1/assignments)

1. POST /assignments/
- Auth: protected, roles teacher or school_admin or super_admin
- Content-Type: multipart/form-data or json
- Request:
	{
		"title": "Assignment 1",
		"description": "Solve questions",
		"module": "moduleId",
		"materialUrl": "optional",
		"dueDate": "2026-05-01T10:00:00.000Z"
	}
- Success 201:
	{
		"message": "Assignment created successfully",
		"assignment": { }
	}

2. GET /assignments/
- Auth: protected
- Query optional: module, q
- Success 200: array of assignments

3. GET /assignments/:id
- Auth: protected
- Success 200: assignment object

4. GET /assignments/:id/material-download
- Auth: protected
- Success 200:
	{
		"downloadUrl": "signedUrl",
		"fileName": "assignment.pdf"
	}

5. POST /assignments/:id/submit
- Auth: protected, role student
- Content-Type: multipart/form-data
- Request:
	- submission file (required)
	- notes (optional)
- Success 200:
	{
		"message": "Assignment submitted successfully",
		"submission": { },
		"submissionStatus": "on_time"
	}

6. GET /assignments/:id/my-submission
- Auth: protected, role student
- Success 200:
	{
		"submission": { }
	}

7. GET /assignments/:id/submissions
- Auth: protected, roles teacher or school_admin or super_admin
- Success 200: array of submissions

8. GET /assignments/:id/submissions/:submissionId/download
- Auth: protected, roles teacher or school_admin or super_admin
- Success 200:
	{
		"downloadUrl": "signedUrl",
		"fileName": "student-work.pdf"
	}

9. PUT /assignments/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Request: partial create fields
- Success 200:
	{
		"message": "Assignment updated successfully",
		"assignment": { }
	}

10. DELETE /assignments/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Success 200:
	{
		"message": "Assignment deleted successfully"
	}

### Quiz Routes (/api/v1/quizzes)

1. POST /quizzes/
- Auth: protected, role teacher
- Request:
	{
		"title": "Quiz 1",
		"moduleId": "moduleId",
		"questions": [
			{
				"questionText": "2 + 2 = ?",
				"options": ["1", "2", "3", "4"],
				"correctAnswer": 3,
				"isFlagged": false
			}
		],
		"timeLimit": 20,
		"isPublished": true
	}
- Success 201:
	{
		"message": "Quiz created successfully",
		"quizId": "quizId"
	}

2. GET /quizzes/my-quizzes
- Auth: protected, role teacher
- Success 200: teacher quizzes

3. GET /quizzes/results/teacher
- Auth: protected, role teacher
- Success 200:
	{
		"results": [ ]
	}

4. GET /quizzes/:id/results
- Auth: protected, role teacher
- Success 200:
	{
		"quiz": {
			"_id": "quizId",
			"title": "Quiz 1",
			"timeLimit": 20,
			"totalQuestions": 10,
			"isPublished": true
		},
		"results": [ ]
	}

5. PUT /quizzes/:id
- Auth: protected, role teacher
- Request: partial create fields
- Success 200:
	{
		"message": "Quiz updated successfully",
		"quiz": { }
	}

6. DELETE /quizzes/:id
- Auth: protected, role teacher
- Success 200:
	{
		"message": "Quiz deleted successfully."
	}

7. GET /quizzes/results/my
- Auth: protected, role student
- Success 200: array of student results

8. GET /quizzes/module/:moduleId
- Auth: protected
- Success 200: published quizzes for module (school-aware)

9. GET /quizzes/:id
- Auth: protected
- Success 200: single published quiz without correct answers

10. POST /quizzes/:id/submit
- Auth: protected, role student
- Request:
	{
		"answers": [3, 1, 0, null],
		"flaggedQuestions": [1, 3]
	}
- Success 201:
	{
		"message": "Quiz submitted successfully",
		"score": 8,
		"totalQuestions": 10,
		"correctAnswers": [3, 1, 0, 2],
		"resultId": "resultId"
	}

### Knowledge Base Routes (/api/v1/knowledge-base)

1. GET /knowledge-base/public
- Auth: public
- Query optional: q
- Success 200: array of published entries

2. GET /knowledge-base/public/:id/attachment-download?index=0
- Auth: public
- Success 200:
	{
		"downloadUrl": "signedUrl",
		"fileName": "attachment.pdf",
		"index": 0
	}

3. GET /knowledge-base/
- Auth: protected, roles teacher or school_admin or super_admin
- Query optional: q
- Success 200: scoped entries

4. POST /knowledge-base/
- Auth: protected, roles teacher or school_admin or super_admin
- Content-Type: multipart/form-data or json
- Request:
	{
		"title": "How to submit assignments",
		"content": "Step by step...",
		"category": "General",
		"isPublished": true
	}
	plus optional attachment files
- Success 201:
	{
		"message": "Knowledge base entry created",
		"entry": { }
	}

5. PUT /knowledge-base/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Request: partial create fields + optional attachment replacements
- Success 200:
	{
		"message": "Knowledge base entry updated",
		"entry": { }
	}

6. DELETE /knowledge-base/:id
- Auth: protected, roles teacher or school_admin or super_admin
- Success 200:
	{
		"message": "Knowledge base entry deleted"
	}

### PDF Quiz Generation Routes (/api/v1/pdf)

1. POST /pdf/generate-from-pdf
- Auth: protected, role teacher
- Content-Type: multipart/form-data
- Request:
	- pdf file (field name: pdf)
	- amount (number of questions)
	- difficulty (easy, medium, hard)
- Success 200:
	{
		"questions": [
			{
				"questionText": "Question",
				"options": ["A", "B", "C", "D"],
				"correctAnswer": 0
			}
		]
	}

## Testing Strategy by Branch

Unit testing branches

1. user-component-testing
2. core-component-testing
3. donate-component-testing
4. quiz-component-testing

Unit testing commands

- api/: npm test
- web/: npm test

Integration testing branch

1. dev-01

Commands:

- api/: npm test

Performance testing branch

1. dev-01

Commands:

- npx artillery run performance/load-test.yml
- npx artillery run performance/load-test.yml --output performance/report.json
- npx artillery report performance/report.json

Current note:

- In this branch snapshot, dedicated test files are minimal. The above branch mapping is preserved exactly as requested.

## Deployment Notes

- Backend runs on Railway
- Frontend runs on Vercel
- Public domain is uniprojects.stie
- Ensure CORS_ORIGIN and FRONTEND_URL include the production domain
- Ensure BACKEND_URL and PayHere callback URLs point to the Railway service

## Security and Operational Notes

- JWT access token required for protected routes
- Refresh token rotation is tracked per user
- Express rate limit is enabled in production
- PDF generation has a stricter dedicated limiter
- Mongo sanitize middleware is enabled for body and params

## Maintainers

Author: OneX Universe (Pvt) Ltd.