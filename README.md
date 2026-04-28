# Clairo Bias Audit Platform

The Clairo Bias Audit Platform is a comprehensive tool designed to detect, analyze, and report statistical biases within machine learning datasets. It evaluates demographic parity, disparate impact, and equal opportunity across sensitive attributes, generating professional PDF reports alongside AI-driven remediation insights.

## Live Demo
[Insert Live Demo URL Here]

## Dashboard
![Dashboard Screenshot](./docs/dashboard.png)

## Getting Started Locally

Running the entire platform is as simple as a single command using Docker. 

### Prerequisites
- Docker and Docker Compose installed.

### Setup
1. Clone the repository.
2. Create a `.env` file in the root directory using the template provided in `.env.example`.

### Required Environment Variables (`.env`)
```env
FIREBASE_SERVICE_ACCOUNT_JSON={...} # Your Firebase Admin SDK JSON stringified
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run the application
```bash
docker-compose up --build
```
- The frontend will be available at `http://localhost:5173`
- The backend API will be available at `http://localhost:8000`

## Architecture
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: FastAPI + WeasyPrint + Jinja2
- **AI Engine**: Google Gemini Flash Lite
- **Storage**: Firebase Firestore
