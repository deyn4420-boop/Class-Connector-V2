# Class Connector

Class Connector is a full-stack classroom management application built with a Flask backend and a React + Vite frontend.

## Features

- Teacher and student authentication
- Teacher dashboard with quick actions
- Assignment creation with optional file attachments
- Student assignment view with download support
- Notes, groups, attendance, progress, and events management
- File upload/download support for assignment materials

## Repository Structure

- `api.py` — Flask API routes and backend logic
- `app.py` — Flask app initialization and database migration setup
- `frontend/` — React + Vite frontend application
- `templates/` — Server-rendered HTML templates used by the Flask app
- `uploads/` — Stored assignment file uploads
- `schema.sql` — SQLite database schema

## Setup

### Backend

1. Install Python 3.11+ and create a virtual environment.
2. Install dependencies:

```bash
python -m pip install -r requirements.txt
```

3. Run the Flask app:

```bash
python app.py
```

The backend should start on `http://127.0.0.1:5000`.

### Frontend

1. Install Node.js and npm.
2. Change into the frontend folder and install packages:

```bash
cd frontend
npm install
```

3. Build the frontend assets:

```bash
npm run build
```

4. The production build is output to `dist/frontend`.

### Development mode

You can run the frontend in development mode using:

```bash
cd frontend
npm run dev
```

Then open the app in the browser at `http://localhost:5173`.

## Usage

- Teachers can create assignments and upload file attachments.
- Students can view assignments and download attached files.
- The app supports teacher and student role-based pages.

## Notes

- The backend uses `/api` endpoints for all data operations.
- Frontend requests are proxied to the backend during development.
- Uploaded files are kept in `uploads/` and served via `/api/download/<file_id>`.

## GitHub Repository

This project is pushed to:

`https://github.com/deyn4420-boop/Class-Connector-V2`

## License

Use this code freely for learning and classroom projects.
