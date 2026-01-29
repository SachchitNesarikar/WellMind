# WellMind

**WellMind** — a compassionate, secure, and evidence‑based mental health platform that helps users assess, learn, connect, and get professional support.

---

![alt text](image.png)
![alt text](image-1.png)

<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <table width="100%" cellpadding="8" cellspacing="0" border="0">
    <tr>
      <td width="33%" valign="top" align="center">
        <img src="image-2.png" alt="Image 2" width="100%">
      </td>
      <td width="33%" valign="top" align="center">
        <img src="image-3.png" alt="Image 3" width="100%">
      </td>
      <td width="33%" valign="top" align="center">
        <img src="image-4.png" alt="Image 4" width="100%">
      </td>
    </tr>
  </table>
</body>
</html>

## Table of Contents
- [About](#about)  
- [Features](#features)  
- [Demo Screens / Flow](#demo-screens--flow)  
- [Getting Started](#getting-started)  
  - [Requirements](#requirements)  
  - [Install](#install)  
  - [Run](#run)  
- [Usage](#usage)  
- [Configuration](#configuration)  
- [Contributing](#contributing)  
- [Security & Privacy](#security--privacy)  
- [Support](#support)  
- [License](#license)

---

## About
WellMind is a comprehensive mental health web application that combines automated assessments, curated resources, an AI assistant, peer support, and appointment booking to help people take control of their mental wellbeing. The platform emphasizes privacy, evidence‑based tools, and human-centered design.

---

## Features
- **Psychological Assessment** — guided questionnaires that produce personalized insights.  
- **Personalized Resources** — articles, videos, and guides tailored to user needs.  
- **AI Chatbot** — instant, non‑clinical conversational support and navigation help.  
- **Peer Forum** — moderated community spaces for sharing and support.  
- **Book Appointment** — schedule sessions with licensed professionals.  
- **Analytics & Progress Tracking** — track mood and assessment history over time.  
- **Secure by Design** — privacy and data protection best practices.

---

## Demo Screens / Flow
1. **Home** — overview, call to action.  
2. **Assessment** — take assessment → receive results and recommendations.  
3. **Resources** — curated content based on assessment.  
4. **Chat** — AI assistant for immediate guidance and signposting.  
5. **Forum** — community threads and moderation tools.  
6. **Appointments** — calendar and booking flow.

---

## Getting Started

### Requirements
- Node.js 18+ (or the version your stack requires)  
- Python 3.10+ (if backend uses Python)  
- PostgreSQL / SQLite (configurable)  
- Redis (optional, for sessions / queues)  
- A modern browser for the frontend

### Install
Clone the repository and install dependencies for frontend and backend.

```bash
git clone https://github.com/your-org/wellmind.git
cd wellmind

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install
```

### Run (development)
Start backend and frontend in development mode.

```bash
cd backend
source venv/bin/activate
export FLASK_ENV=development  
python main.py

cd ../frontend
npm run dev
```

Open `http://localhost:3000` (or configured port) to view the app.

---

## Usage
- **Take Assessment** — navigate to the Assessment page and complete the questionnaire. Results appear immediately with recommended resources.  
- **Explore Resources** — browse or search curated content; save favorites.  
- **Chat with AI** — use the AI assistant for guidance, resource suggestions, or to clarify assessment results. Note: AI is not a substitute for professional care.  
- **Join Forum** — create or reply to threads; follow community guidelines.  
- **Book Appointment** — select a provider, choose a time, and confirm booking.

---

## Configuration
Configuration is environment driven. Example environment variables:

```
# backend/.env
DATABASE_URL=postgres://user:pass@localhost:5432/wellmind
SECRET_KEY=your-secret-key
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASS=...
AI_PROVIDER_API_KEY=...
```

Ensure secrets are stored securely and not committed to source control.

---

## Contributing
Contributions are welcome.

- Fork the repo and create a feature branch.  
- Open a pull request with a clear description and tests where applicable.  
- Follow the code style and include unit/integration tests for new features.  
- For major changes, open an issue first to discuss the design.

---

## Security & Privacy
- **Data minimization:** collect only what is necessary.  
- **Encryption:** use TLS in transit; encrypt sensitive data at rest where appropriate.  
- **Access controls:** role-based access for professionals and moderators.  
- **Privacy:** do not store or share user data without consent. Follow applicable laws and best practices.

If you discover a security vulnerability, please report it privately to `security@wellmind.com`.

---

## License
This project is released under the **MIT License**. See `LICENSE` for details.

---

## Acknowledgements
Built with care for mental wellbeing. If you use or adapt this project, please credit WellMind and follow ethical guidelines for mental health tools.

---

**WellMind** — Your trusted companion for mental health and wellbeing.