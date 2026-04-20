# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Login with role-based access
- Sign up and unregister with role checks

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
| POST   | `/auth/login`                                                     | Login and receive a bearer token                                   |
| POST   | `/auth/logout`                                                    | Logout and invalidate current token                                |
| GET    | `/auth/me`                                                        | Return authenticated user info                                     |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity (requires auth)                            |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister from an activity (requires auth)                    |

### Demo Login Credentials

- `student1` / `student123` (role: `student`)
- `advisor1` / `advisor123` (role: `advisor`)
- `admin1` / `admin123` (role: `admin`)

### Role Rules

- Students can sign up/unregister only their own account email.
- Advisors and admins can sign up/unregister any student email.
- Unauthenticated requests to protected endpoints return `401`.

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
