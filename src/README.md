# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/login?email=...&password=...`                                   | Log in as a STUDENT, FACULTY, or ADMINISTRATOR user                 |
| GET    | `/me`                                                             | Returns the currently authenticated user                            |
| GET    | `/dashboard`                                                      | Returns a role-aware dashboard summary                              |
| POST   | `/activities/{activity_name}/signup?email=...`                    | Sign up for an activity (requires login)                            |
| DELETE | `/activities/{activity_name}/unregister?email=...`                | Unregister from an activity (requires login)                        |

## Authentication

This app now supports role-based authentication with three built-in users:

- `student@mergington.edu` / `studentpass` — STUDENT
- `teacher@mergington.edu` / `teacherpass` — FACULTY
- `admin@mergington.edu` / `adminpass` — ADMINISTRATOR

Students can only sign up or unregister themselves. Faculty and administrators can manage any student record.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
