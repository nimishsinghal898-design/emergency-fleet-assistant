# Quickstart

The Emergency Fleet Command system has been packaged into a single unified Docker container for effortless evaluation.

## Prerequisites
- Git
- Docker & Docker Compose

## 1-Command Execution

```bash
# Clone the repository
git clone https://github.com/your-username/emergency-fleet.git
cd emergency-fleet

# Build and run using Docker Compose (or direct docker run)
docker build -t emergency-fleet .
docker run -p 8000:8000 emergency-fleet
```

## Accessing the Dashboard
Open your browser and navigate to:
**http://localhost:8000**

*(The FastAPI backend automatically serves the pre-compiled React static assets on the root path, providing a seamless single-port experience.)*

---

## Local Development (Without Docker)

If you wish to run the frontend and backend in separate development servers with hot-reloading:

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend
Open a new terminal.
```bash
cd frontend
npm install
npm run dev
```
Navigate to **http://localhost:5173**.
