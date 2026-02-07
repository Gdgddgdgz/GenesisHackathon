# SME Supply-Chain Synthesizer

A unified inventory management, demand forecasting, and vendor coordination platform.

## 🚀 Quick Start

### Prerequisites
1.  **Node.js**: v16+
2.  **Python**: v3.9+
3.  **Databases**: PostgreSQL, Redis, MongoDB
    -   *Option A*: Run via Docker (`docker-compose up -d`)
    -   *Option B*: Ensure local instances are running and update `.env` files.

### 1. Start the Backend (Node.js)
Runs the core API server.
```bash
cd server
npm install
npm start
```
*Port: 5000*

### 2. Start the AI Engine (Python)
Runs the demand forecasting service.
```bash
cd ai_service
# Activate virtual env
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Port: 8000*

### 3. Start the Frontend (React)
Runs the dashboard UI.
```bash
cd client
npm install
npm run dev
```
*Access at: http://localhost:5173*
