
# 🗣️ JanAwaz (Jansakshi)

AI-driven, WhatsApp-integrated civic complaint platform for rural India**

JanAwaz enables rural citizens to file complaints (text, voice, image, or video) about civic issues — roads, water, electricity, and more — directly through WhatsApp, in their own language. An AI engine automatically extracts structured data from each complaint and routes it to the right local authority, while citizens and officers are both incentivized through a gamified badge and reward system.

 🔍 The Problem

Rural citizens often face civic issues (broken roads, water shortages, power outages) but have no simple, accessible way to report them to the right authority. Complaint processes are often bureaucratic, language-restrictive, and lack any feedback loop — leading to low civic participation and unresolved issues.

 ✅ The Solution

- Citizens file complaints directly via **WhatsApp** — by text, voice note, photo, or video — in **Hindi, Bhojpuri, or Maithili**
- An AI engine (Gemini) processes the complaint: transcribes voice, translates if needed, and extracts structured data (department, location, issue type) as JSON
- The complaint is **auto-routed** to the correct department (Road, Water, Electricity, etc.)
- Citizens get a **login and complaint tracking ID** back via WhatsApp automatically
- Officers manage complaints through a **department-wise dashboard**, with performance tracked over time
- Both citizens and officers earn **badges and rewards** for participation and resolution

🛠️ Tech Stack

| Component | Technology |
|---|---|
| Messaging | WhatsApp Cloud API / Twilio |
| AI Engine | Gemini API (voice-to-text, translation, JSON extraction) |
| Backend | Python (FastAPI / Django) |
| Database | PostgreSQL / MongoDB |
| Frontend | Deployed web dashboard |

## 🏅 Gamification System

Citizen Badges
| Badge | Requirement | Reward |
|---|---|---|
| Aware Citizen | 1 complaint | 10 coins |
| Active Citizen | 5 complaints | 20 coins + icon |
| Community Hero | 15 complaints | 50 coins + priority resolution |
| Super Leader | 30+ complaints | VIP support + gift voucher |

Officer/Authority Badges
| Badge | Requirement | Reward |
|---|---|---|
| Quick Responder | 5 resolved | 50 coins + certificate |
| Star Resolver | 20 resolved | 250 coins + monthly banner |
| Department Champion | 50 resolved | 700 coins + appreciation letter |
| Master Administrator | 100+ resolved | Performance bonus voucher |

 📁 Repositories

- Frontend: deployed (https://janasakshi-frontend-peach.vercel.app/en)
- Backend: [jansakshi-back](https://jansakshi-ai.onrender.com)

 🔄 User Flow

1. New user messages the WhatsApp bot → auto-registered with a generated email/password linked to their phone number
2. Existing users' complaints are automatically linked to their account
3. Complaint is processed by the AI engine and routed to the correct department
4. User receives a WhatsApp confirmation with a complaint tracking ID
5. Officer resolves the complaint via the dashboard; citizen is notified

🔮 Future Scope

- Expand language support to more regional dialects
- SMS fallback for non-smartphone users
- Public transparency dashboard showing department-wise resolution rates
- Integration with government e-governance portals

👩‍💻 Author

**Shambhavi Chaudhary**
B.Tech CSE, GITA Autonomous College
[LinkedIn](https://linkedin.com/in/shambhavi-chaudhary-baa8892a3) · [GitHub](https://github.com/chaudhary90065)

## 📄 License

This project is for educational and portfolio purposes.
