# AI Expense Tracker — Project Documentation

## 1. Project Overview

The **AI Expense Tracker** is a full-stack web application that uses artificial intelligence to automatically extract, store, analyze, and visualize personal expense data. Users can upload receipts (images) or bank statements (PDFs), and the system uses Google's Gemini AI to intelligently parse the documents and extract structured expense information — including date, merchant name, amount, and category — without any manual data entry.

The application also features an AI-powered chatbot that lets users ask natural-language questions about their spending habits, and a dashboard that provides visual insights through interactive charts and AI-generated financial summaries.

---

## 2. Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python** | Core backend language |
| **FastAPI** | REST API framework for handling HTTP requests |
| **Uvicorn** | ASGI server to run the FastAPI application |
| **SQLAlchemy** | ORM (Object-Relational Mapping) for database operations |
| **SQLite** | Lightweight file-based relational database (`expenses.db`) |
| **Pydantic** | Data validation and schema definitions |
| **Google GenAI SDK** | Interface to Google's Gemini 2.5 Flash model for vision and text AI |
| **Groq SDK** | Interface to Llama 3.3 70B model (via Groq cloud) as a fallback AI provider |
| **python-dotenv** | Loads API keys from the `.env` file |
| **python-multipart** | Handles file uploads (multipart form data) |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework for building the single-page application |
| **Vite 8** | Fast build tool and development server |
| **Axios** | HTTP client for API communication with the backend |
| **Recharts** | Charting library for bar charts and line graphs |
| **Lucide React** | Modern icon library used throughout the UI |
| **Vanilla CSS** | Custom styling with glassmorphism, animations, and dark theme |

### AI Models Used
| Model | Provider | Role |
|---|---|---|
| **Gemini 2.5 Flash** | Google | Document parsing (vision), structured data extraction from images/PDFs |
| **Llama 3.3 70B Versatile** | Groq | Chatbot responses and financial insight generation (primary) |
| **Gemini 2.5 Flash** | Google | Chatbot fallback when Groq is unavailable |

---

## 3. Architecture & Data Flow

The application follows a standard **client-server architecture** with a clear separation between the React frontend and the FastAPI backend.

```
┌──────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Vite)                    │
│                    http://localhost:5173                      │
│                                                              │
│  ┌─────────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐  │
│  │ File Upload  │  │ DataTable │  │ Dashboard │  │Chatbot │  │
│  │ (drag/drop) │  │ (edit)    │  │ (charts)  │  │  (AI)  │  │
│  └──────┬──────┘  └─────┬─────┘  └─────┬─────┘  └───┬────┘  │
└─────────┼───────────────┼───────────────┼────────────┼───────┘
          │ POST /upload  │POST /expenses │POST /summary│POST /chat
          ▼               ▼               ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND (Uvicorn)                  │
│                    http://localhost:8000                      │
│                                                              │
│  ┌────────────────────┐    ┌─────────────────────────────┐   │
│  │   gemini_service.py │    │         main.py (Routes)    │   │
│  │                    │    │  /upload    → Gemini Vision  │   │
│  │  • extract_from_   │◄───│  /expenses → CRUD database  │   │
│  │    image()         │    │  /summary  → AI Insights    │   │
│  │  • extract_from_   │    │  /chat     → AI Chatbot     │   │
│  │    pdf()           │    └──────────────┬──────────────┘   │
│  │  • chat_with_data()│                   │                  │
│  │  • generate_dual_  │    ┌──────────────▼──────────────┐   │
│  │    summary()       │    │    SQLite (expenses.db)      │   │
│  └────────────────────┘    │  id | date | merchant |     │   │
│                            │     total | category        │   │
│                            └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
   ┌─────────────┐           ┌─────────────┐
   │ Google       │           │ Groq Cloud  │
   │ Gemini API   │           │ (Llama 3)   │
   └─────────────┘           └─────────────┘
```

### Request Flow — File Upload & Extraction

1. User drags and drops a receipt image (JPG/PNG) or bank statement (PDF) into the **FileUpload** component.
2. The file is sent as a `multipart/form-data` POST request to `POST /upload`.
3. The backend detects the file type:
   - **Images** → Sent directly to Gemini 2.5 Flash with the image bytes and a structured extraction prompt.
   - **PDFs** → Saved as a temporary file, uploaded to Gemini's file API, then processed with a structured extraction prompt.
4. Gemini returns a JSON array of expenses, validated against the `ExpenseExtraction` Pydantic schema.
5. The extracted data is returned to the frontend and displayed in the editable **DataTable** component.
6. The user reviews, edits if needed, and clicks **Save** — which sends each expense row as a `POST /expenses/` request to be stored in SQLite.

### Request Flow — AI Chatbot

1. User types a question in the **Chatbot** component (e.g., *"What did I spend the most on?"*).
2. The message is sent to `POST /chat`.
3. The backend fetches all expenses from the database, serializes them to JSON, and passes both the data context and the user's question to the AI.
4. The system tries **Groq (Llama 3.3)** first. If Groq fails or hits rate limits, it automatically falls back to **Gemini 2.5 Flash**.
5. The AI response is returned and displayed in the chat interface.

### Request Flow — AI Financial Insights

1. User clicks **Generate Insights** in the Dashboard.
2. A `POST /summary` request is sent, optionally including any currently uploaded (unsaved) data.
3. The backend fetches all historical expenses from the database and combines them with the current upload data.
4. Both datasets are sent to the AI with a structured prompt requesting immediate insights, overall trends, and actionable advice.
5. The generated summary is displayed in the Dashboard's insights panel.

---

## 4. Project Structure

```
AI_mini/
├── .env                          # API keys (GEMINI_API_KEY, GROQ_API_KEY)
├── expenses.db                   # SQLite database (root-level copy)
│
├── backend/                      # FastAPI Backend
│   ├── main.py                   # API route definitions (5 endpoints)
│   ├── gemini_service.py         # AI service layer (Gemini + Groq integration)
│   ├── models.py                 # SQLAlchemy ORM model (Expense table)
│   ├── schemas.py                # Pydantic schemas for validation
│   ├── database.py               # Database engine and session configuration
│   ├── requirements.txt          # Python dependencies
│   └── expenses.db               # SQLite database (active)
│
├── client/                       # React Frontend (Vite)
│   ├── index.html                # HTML entry point
│   ├── package.json              # Node.js dependencies
│   ├── vite.config.js            # Vite configuration
│   └── src/
│       ├── App.jsx               # Main app layout and state management
│       ├── index.css             # Global styles (dark theme, glassmorphism)
│       └── components/
│           ├── FileUpload.jsx    # Drag-and-drop file upload with AI extraction
│           ├── DataTable.jsx     # Editable table for reviewing extracted data
│           ├── Dashboard.jsx     # Charts, expense table, date filters, AI insights
│           └── Chatbot.jsx       # AI chat interface for querying expenses
│
└── frontend/                     # Legacy Streamlit frontend (deprecated)
```

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Accepts an image or PDF file, extracts expense data using Gemini Vision AI, and returns structured JSON |
| `POST` | `/expenses/` | Saves a single expense record to the SQLite database |
| `GET` | `/expenses/` | Retrieves all stored expenses (with optional `skip` and `limit` pagination) |
| `DELETE` | `/expenses/{id}` | Deletes a specific expense record by ID |
| `POST` | `/chat` | Accepts a user message, queries all expenses from the DB, and returns an AI-generated response |
| `POST` | `/summary` | Generates AI financial insights combining current upload data with historical database records |

---

## 6. Database Schema

The application uses a single `expenses` table in SQLite:

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-incrementing primary key |
| `date` | Date | Date of the expense (YYYY-MM-DD) |
| `merchant` | String | Name of the merchant or store |
| `total` | Float | Expense amount |
| `category` | String | Category (e.g., Groceries, Dining, Utilities, Transportation, Entertainment) |

---

## 7. How to Run

### Prerequisites
- **Python 3.10+** installed
- **Node.js 18+** and npm installed
- API keys for **Google Gemini** and **Groq** stored in the `.env` file

### Start the Backend
```bash
cd backend
uvicorn main:app --reload
```
The API server starts at `http://localhost:8000`. Swagger docs are available at `http://localhost:8000/docs`.

### Start the Frontend
```bash
cd client
npm run dev
```
The React app starts at `http://localhost:5173`.

### Install Dependencies (if first time)
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
cd client
npm install
```

---

## 8. Key Design Decisions

- **Dual AI Provider Strategy**: The chatbot and insights features use Groq (Llama 3.3 70B) as the primary provider because of its generous free tier and fast inference. If Groq fails or hits rate limits, the system automatically falls back to Google Gemini. This ensures high availability without any user intervention.

- **Gemini for Vision Tasks**: Document extraction (receipts and PDFs) exclusively uses Gemini 2.5 Flash because it supports native multimodal input (images and documents) with structured JSON output — a capability not available through Groq's API.

- **SQLite for Simplicity**: SQLite was chosen as the database because it requires zero configuration, stores everything in a single file, and is perfectly suited for a personal expense tracker that runs locally.

- **Glassmorphism UI**: The frontend uses a dark theme with frosted-glass panels, subtle gradients, and smooth animations to create a modern, premium aesthetic without relying on any CSS framework.
