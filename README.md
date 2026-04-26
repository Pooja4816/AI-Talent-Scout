#   AI Talent Scout  
### AI-Powered Talent Discovery & Intelligent Engagement Platform

**AI Talent Scout** is an AI-powered recruitment platform designed to automate and simplify the hiring process. By leveraging **Google Gemini AI** along with an intelligent matching engine, the system efficiently analyzes job requirements and identifies the most relevant candidates.

The platform not only calculates accurate **Match Scores** but also enables real-time **recruiter-candidate interaction**, automated messaging, and seamless **interview scheduling**.

With secure authentication powered by **Supabase**, both recruiters and candidates can log in, communicate, and complete the hiring workflow efficiently within a single platform.
---

##  Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion  
- **Backend**: Node.js, Express.js  
- **Database & Auth**: Supabase (PostgreSQL + Authentication)  
- **AI Integration**: Google Gemini API  
- **Deployment**: Vercel (Frontend), Render/Railway (Backend)
---

##  System Architecture

The application follows a modern client-server architecture with real-time interaction and secure authentication.

- The **Frontend (React)** handles UI rendering, user interactions, and API communication.
- The **Backend (Node.js/Express)** processes requests, performs candidate matching, and integrates with AI services.
- **Supabase** manages authentication and database operations for recruiters and candidates.
- **Google Gemini AI** is used for intelligent skill extraction and matching.

```mermaid
graph TD

    %% Frontend
    subgraph Frontend["Frontend (React / Vite)"]
        UI[User Interface]
        API[API Client (Axios)]
        UI -->|Login / Actions| API
    end

    %% Backend
    subgraph Backend["Backend (Node.js / Express)"]
        SERVER[Express Server]
        MATCH[Matching Engine]
        GEMINI[Gemini Service]
    end

    %% Database
    subgraph Database["Supabase"]
        AUTH[Authentication]
        DB[(PostgreSQL Database)]
    end

    %% External AI
    subgraph AI["AI Service"]
        GEMINI_API[Google Gemini API]
    end

    API --> SERVER
    SERVER --> MATCH
    SERVER --> GEMINI
    SERVER --> DB
    SERVER --> AUTH

    GEMINI --> GEMINI_API

    




    

---

⚙️ Core Features
🤖 AI-Based Job Role Analysis

The system allows recruiters to enter a job role or required skills, which are intelligently processed using AI to understand the requirements and expectations of the role.

🎯 Smart Candidate Matching

Candidates are matched based on their skills, experience, and relevance using a combination of AI algorithms and keyword-based filtering to ensure accurate and efficient shortlisting.

🔐 Secure Authentication (Supabase)

The platform uses Supabase for secure user authentication, enabling both recruiters and candidates to register and log in safely.

💬 Automated Messaging System

Recruiters can directly send messages to shortlisted candidates through the platform, streamlining communication.

⚡ Real-Time Interaction

Candidates can respond to recruiter messages in real time, enabling a seamless and interactive communication flow.

📅 Interview Scheduling

Recruiters and candidates can easily coordinate and finalize interview slots within the system.

---

##  Scoring & Matching Logic

The matching system in **AI Talent Scout** is designed to accurately evaluate candidate suitability using a combination of intelligent filtering and AI-powered analysis.

- **Match Score**  
  Calculates how well a candidate’s skills align with the job requirements.  
  The system compares required skills with candidate profiles using precise matching logic to avoid incorrect matches (e.g., distinguishing between similar technologies).  
  Higher alignment results in a higher match percentage.

- **Interest Score**  
  Estimates the candidate’s likelihood of engagement based on their skill relevance and interaction flow.  
  Candidates with stronger alignment are more likely to respond positively, resulting in higher interest scores.

---

##  API Integration (Google Gemini)

The application integrates **Google Gemini AI** to enable intelligent processing of job roles and candidate data.

All AI-related logic is securely handled in the backend to protect API keys and ensure safe communication.

- **Skill Extraction**  
  The system processes job role inputs using Gemini AI to identify relevant skills and requirements from natural language text.

- **Candidate Matching Support**  
  Extracted skills are used to enhance the accuracy of the matching engine and improve candidate ranking.

- **Intelligent Interaction Support**  
  Gemini AI helps generate meaningful responses and supports recruiter-candidate communication by understanding context and intent.

> [!NOTE]  
> AI is used to enhance accuracy and decision-making, while core matching logic ensures consistent and reliable results.
---

##  Local Setup & Installation

### 🔧 Prerequisites
Ensure you have the following installed and configured:

- Node.js (v18 or higher)  
- Google Gemini API Key  
- Supabase Project (URL and Anon Key)  
---

###  Step-by-Step Setup

 ###  Clone Repository

```bash
git clone <your_repo_url>
cd ai-talent-scout

###  Configure the Environment

Navigate to the `/server` directory and create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
PORT=5000

 **Install Dependencies**
   Open two separate terminals for the Frontend and Backend.
   
   **Terminal 1 (Backend):**
   ```bash
   cd server
   npm install
   node server.js
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm install
   npm run dev
   ```

 ###  Launch (Deployed Application)

Once deployed, access the application using:

-  Frontend (Vercel):  
  https://your-project.vercel.app  

-  Backend (Render):  
  https://your-backend.onrender.com  

