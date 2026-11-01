# RescueNet AI: Demo Script (5 se 7 minute)

## Demo se pehle (5 minute pehle)
- PostgreSQL chal raha ho.
- Backend: cd backend, venv\Scripts\activate, uvicorn main:app --reload
- Frontend: cd frontend, npm run dev
- Reset: python reset_demo.py (backend folder se), saare incidents Pending ho jayenge.
- Browser mein localhost:5173 kholo aur refresh karo.
- Internet aur charger check karo.

## 1. Problem (30 second)
"Jab ek saath kai emergencies aati hain, to control room ko tay karna padta hai ki pehle kahan jaana hai. Galat order ka matlab hai jaan ka nuksan. RescueNet AI ye faisla tez aur samjhane layak banata hai."

## 2. Dashboard (1 minute)
- Map dikhao: har gola ek emergency hai, lal sabse urgent, hara sabse kam.
- List dikhao: sabse upar sabse zyada priority wali emergency.
- Ek incident ka AI summary dikhao: "AI ne report padhke type, severity aur khatre mein logon ka andaza lagaya."
- Formula bolo: priority = severity x 5 + khatre mein log x 3.

## 3. Auto Dispatch (2 minute): sabse zaroori hissa
- Bolo: "Ab 10 emergencies ek saath pending hain, par humare paas sirf 7 rescue saadhan hain."
- Auto Dispatch dabao.
- Dikhao: upar ki zyada priority wali emergencies ko sabse paas ke saadhan mile (hari patti mein naam).
- Dikhao: neeche ki kam priority wali Pending reh gayi, kyunki saadhan khatam.

## 4. Saadhan wapas free hona (1 minute)
- Ek assigned emergency par Resolve dabao.
- Phir Auto Dispatch dobara dabao.
- Dikhao: jo saadhan free hua wo ab agli waiting emergency ko mil gaya.

## 5. Live report (sirf agar sab theek ho, 1 minute)
- Ek hi naya report bhejo (latitude aur longitude ke saath), jaise: "Highway par truck palat gaya, driver fasa hai".
- Dikhao: AI ne type aur severity bhar di.
- Agar AI jawab na de (limit ya internet), ghabrao mat. Bolo: "Ye free tier ki limit hai, system ne report phir bhi save kar li." Aage badh jao.

## 6. Technology (30 second)
React dashboard, FastAPI backend, PostgreSQL database, Gemini AI, Leaflet map.

## 7. Limitations (30 second)
- Ye academic prototype hai, asli dispatch system nahi.
- AI ki priority sirf sujhaav hai, aakhri faisla insaan operator ka hoga.
- Free AI tier ki rozana limit hai.

## Aam sawal aur jawab
- AI galat ho jaye to? Operator verify karega, aur status haath se badal sakta hai.
- Aage kya? Live GPS, SMS alerts, real ambulance data, aur AWS par deploy.
- Priority formula kyun? Taaki faisla samjhane layak (explainable) rahe, AI ka black box na ho.