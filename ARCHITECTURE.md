# Smash Univerz — Full Web Application Architecture

> **Tech Stack:** Next.js 14 (App Router) · MongoDB Atlas · Vercel · Razorpay · WhatsApp Business API (WATI)  
> **Deployment Target:** Vercel (free/hobby) + MongoDB Atlas Free Tier → ~₹0–₹2,000/month MVP  

---

## 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Public Site │  │  Admin Panel │  │   Staff Mobile Panel  │  │
│  │ (Next.js SSR)│  │ (Next.js App)│  │   (Next.js PWA)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
└─────────┼─────────────────┼───────────────────────┼─────────────┘
          │                 │                       │
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES (/api/*)                     │
│   Auth · Members · Students · Attendance · Payments · Tourney   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌──────────────┐  ┌────────────┐  ┌──────────────┐
  │ MongoDB Atlas│  │  Razorpay  │  │  WATI/Green  │
  │ (Database)   │  │ (Payments) │  │  API (WA)    │
  └──────────────┘  └────────────┘  └──────────────┘
          │
  ┌───────┴────────┐
  │  Cron Jobs     │  ← Vercel Cron (free) or GitHub Actions
  │ (Reminders)    │
  └────────────────┘
```

### Component Responsibilities

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Frontend | Next.js 14 App Router | UI, SSR pages, admin dashboard |
| API | Next.js API Routes | Business logic, REST endpoints |
| Database | MongoDB Atlas (M0 Free) | All data storage |
| Auth | NextAuth.js | Session, role-based access |
| Payments | Razorpay | Payment links, webhooks |
| WhatsApp | WATI or Interakt | Automated WA messages |
| Scheduler | Vercel Cron Jobs | Daily reminder triggers |
| Hosting | Vercel Hobby | Free tier, auto-deploy |
| Media | Cloudinary (free) | Tournament bracket images, gallery |

---

## 2. DATABASE SCHEMA (MongoDB Collections)

### `users` — Staff & Admin Accounts
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "passwordHash": "string",
  "role": "admin | staff",
  "assignedBatches": ["ObjectId"],  // for staff
  "createdAt": "Date",
  "isActive": "boolean"
}
```

### `members` — Court Membership
```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",          // primary key for WA
  "email": "string",
  "photo": "string",          // Cloudinary URL (optional)
  "membershipPlan": "monthly | quarterly | yearly",
  "startDate": "Date",
  "expiryDate": "Date",
  "paymentStatus": "paid | pending | overdue",
  "autoRenew": "boolean",
  "notes": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `membershipPlans` — Plan Configuration
```json
{
  "_id": "ObjectId",
  "name": "Monthly | Quarterly | Yearly",
  "durationDays": 30,
  "price": 1500,
  "description": "string",
  "isActive": "boolean"
}
```

### `students` — Coaching Students
```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",
  "parentPhone": "string",    // for minors
  "email": "string",
  "age": "number",
  "batchId": "ObjectId",
  "coachId": "ObjectId",
  "enrollmentDate": "Date",
  "feeAmount": "number",
  "feeDueDate": "Date",
  "feeStatus": "paid | pending | overdue",
  "performanceNotes": "string",
  "isActive": "boolean",
  "createdAt": "Date"
}
```

### `batches` — Coaching Batches
```json
{
  "_id": "ObjectId",
  "name": "Batch A - Morning",
  "coachId": "ObjectId",
  "timing": "06:00 - 08:00",
  "days": ["Mon", "Wed", "Fri"],
  "maxStudents": 15,
  "currentStudents": "number",
  "level": "beginner | intermediate | advanced",
  "isActive": "boolean"
}
```

### `attendance` — Daily Student Attendance
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "batchId": "ObjectId",
  "markedBy": "ObjectId",     // staff userId
  "date": "Date",             // YYYY-MM-DD (indexed)
  "status": "present | absent | leave",
  "note": "string"
}
```

### `payments` — Transaction History
```json
{
  "_id": "ObjectId",
  "entityType": "member | student",
  "entityId": "ObjectId",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "amount": "number",
  "currency": "INR",
  "status": "created | paid | failed | refunded",
  "paymentLink": "string",
  "paymentLinkId": "string",
  "purpose": "membership_renewal | coaching_fee | tournament_entry",
  "createdAt": "Date",
  "paidAt": "Date"
}
```

### `tournaments`
```json
{
  "_id": "ObjectId",
  "name": "Summer Open 2025",
  "description": "string",
  "startDate": "Date",
  "endDate": "Date",
  "venue": "string",
  "registrationDeadline": "Date",
  "entryFee": "number",
  "categories": [
    {
      "id": "uuid",
      "name": "Men's Singles",
      "type": "singles | doubles | mixed",
      "format": "knockout | league | group+knockout",
      "maxParticipants": 32,
      "status": "open | closed | ongoing | completed"
    }
  ],
  "isPublic": "boolean",
  "status": "draft | registration_open | ongoing | completed",
  "createdBy": "ObjectId",
  "createdAt": "Date"
}
```

### `tournamentRegistrations`
```json
{
  "_id": "ObjectId",
  "tournamentId": "ObjectId",
  "categoryId": "string",
  "playerType": "singles | doubles",
  "player1": {
    "name": "string",
    "phone": "string",
    "memberId": "ObjectId"    // null if non-member
  },
  "player2": {                // for doubles only
    "name": "string",
    "phone": "string",
    "memberId": "ObjectId"
  },
  "paymentId": "ObjectId",
  "status": "registered | confirmed | withdrawn",
  "registeredAt": "Date"
}
```

### `fixtures` — Tournament Brackets
```json
{
  "_id": "ObjectId",
  "tournamentId": "ObjectId",
  "categoryId": "string",
  "round": 1,                 // 1=QF, 2=SF, 3=Final
  "matchNumber": 1,
  "player1Id": "ObjectId",   // tournamentRegistration ID
  "player2Id": "ObjectId",
  "scheduledTime": "Date",
  "court": "Court 1",
  "scores": [
    { "set": 1, "p1": 21, "p2": 15 },
    { "set": 2, "p1": 18, "p2": 21 },
    { "set": 3, "p1": 21, "p2": 19 }
  ],
  "winnerId": "ObjectId",
  "status": "scheduled | ongoing | completed | walkover",
  "nextMatchId": "ObjectId"  // for bracket progression
}
```

### `notifications` — Log of all sent messages
```json
{
  "_id": "ObjectId",
  "entityType": "member | student",
  "entityId": "ObjectId",
  "channel": "whatsapp | sms | email",
  "type": "expiry_reminder | fee_reminder | payment_link | tournament_update",
  "message": "string",
  "status": "sent | failed | delivered",
  "sentAt": "Date"
}
```

---

## 3. API DESIGN (Key Endpoints)

### Auth
```
POST   /api/auth/[...nextauth]  — NextAuth login/logout
```

### Members
```
GET    /api/members             — List all (paginated, search)
POST   /api/members             — Add new member
GET    /api/members/:id         — Get member detail
PUT    /api/members/:id         — Update member
DELETE /api/members/:id         — Soft delete
POST   /api/members/:id/renew   — Trigger renewal (creates payment link)
GET    /api/members/expiring    — Members expiring in N days (for cron)
```

### Students
```
GET    /api/students            — List (filter by batch, status)
POST   /api/students            — Enroll student
GET    /api/students/:id        — Student profile
PUT    /api/students/:id        — Update details/notes
POST   /api/students/:id/fee    — Generate fee payment link
```

### Batches
```
GET    /api/batches             — List batches
POST   /api/batches             — Create batch
PUT    /api/batches/:id         — Edit batch
```

### Attendance
```
POST   /api/attendance          — Mark attendance (bulk for batch)
GET    /api/attendance?batchId=&date=  — Get attendance for day
GET    /api/attendance/student/:id     — Student's attendance history
```

### Payments
```
POST   /api/payments/create-link       — Create Razorpay payment link
POST   /api/payments/webhook           — Razorpay webhook (payment status)
GET    /api/payments?entityId=         — Payment history
```

### Notifications
```
POST   /api/notifications/send         — Send manual WA/SMS
POST   /api/cron/reminders             — Called by Vercel Cron daily
```

### Tournaments
```
GET    /api/tournaments                       — Public tournament list
POST   /api/tournaments                       — Create tournament (admin)
GET    /api/tournaments/:id                   — Tournament details
PUT    /api/tournaments/:id                   — Edit tournament
POST   /api/tournaments/:id/register          — Register player
GET    /api/tournaments/:id/brackets          — Get full bracket (public)
PUT    /api/tournaments/:id/fixtures/:fid     — Update match score
POST   /api/tournaments/:id/generate-fixtures — Auto-generate fixtures
```

---

## 4. FEATURE BREAKDOWN

### MVP (Build First — 4–6 weeks)
- [x] Next.js project setup + MongoDB connection
- [x] NextAuth with Admin role
- [x] Member CRUD + plan management
- [x] Student enrollment + batch management
- [x] Attendance marking (staff panel)
- [x] Razorpay payment link generation
- [x] Basic WhatsApp messages via WATI
- [x] Dashboard (counts, expiring soon, pending fees)
- [x] Basic tournament: create, register, knockout bracket

### Phase 2 (Month 2–3)
- [ ] Cron job: daily expiry + fee reminders
- [ ] Public tournament bracket page (leaderboard)
- [ ] Staff role with limited permissions
- [ ] SMS fallback (Textlocal/MSG91)
- [ ] Member self-renewal portal (public page + payment link)
- [ ] Performance notes per student

### Phase 3 (Future)
- [ ] Student/member mobile app (or PWA)
- [ ] Online court booking slot system
- [ ] League format tournament (round-robin)
- [ ] Automated receipt generation (PDF)
- [ ] Analytics dashboard (revenue, attendance trends)
- [ ] Email newsletters (via Resend.com free tier)

---

## 5. WHATSAPP INTEGRATION (Step-by-Step)

### Recommended Service: **WATI** (WhatsApp Team Inbox)
- ✅ India-based pricing (₹2,499/month for 500 conversations — or pay per template)
- ✅ Official WhatsApp Business API (no ban risk)
- ✅ Template message support (reminders, payment links)
- ✅ REST API easy to integrate

### Alternative (Even Cheaper): **Interakt**
- ₹799/month starter plan
- Good for small businesses in India
- REST API + webhook support

### Budget Option: **Meta Cloud API (Direct)**
- FREE to use (you pay per conversation: ~₹0.60–₹0.90/convo)
- Requires Facebook Business verification (~1 week setup)
- Best long-term for cost control

---

### Implementation Steps

**Step 1 — Setup WhatsApp Business Account**
1. Create Facebook Business Manager at business.facebook.com
2. Add a dedicated phone number (not personal)
3. Apply for WhatsApp Business API access
4. Register with WATI/Interakt OR use Meta Cloud API directly

**Step 2 — Create Message Templates** (must be approved by Meta)
```
Template: membership_expiry_reminder
"Hi {{1}}, your Smash Univerz membership expires on {{2}}. 
Renew now: {{3}}"

Template: fee_pending_alert
"Hi {{1}}, coaching fee of ₹{{2}} is due on {{3}}.
Pay here: {{4}}"

Template: payment_confirmation
"Hi {{1}}, payment of ₹{{2}} received! 
Valid till: {{3}}. Thank you! 🏸"
```

**Step 3 — Integrate in Next.js API**
```javascript
// lib/whatsapp.js
export async function sendWhatsAppTemplate(phone, templateName, params) {
  const res = await fetch('https://live-server.wati.io/api/v1/sendTemplateMessage', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${process.env.WATI_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_name: templateName,
      broadcast_name: templateName,
      parameters: params.map((v, i) => ({ name: (i+1).toString(), value: v })),
      receivers: [{ whatsappNumber: `91${phone}` }]
    })
  });
  return res.json();
}
```

**Step 4 — Cron Job (Daily Reminders)**
```javascript
// app/api/cron/reminders/route.js
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }] }

export async function GET(req) {
  // Verify cron secret
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const threeDaysFromNow = new Date(Date.now() + 3 * 86400000);
  const expiringMembers = await Member.find({ expiryDate: { $lte: threeDaysFromNow } });
  
  for (const member of expiringMembers) {
    const payLink = await createRazorpayLink(member);
    await sendWhatsAppTemplate(member.phone, 'membership_expiry_reminder', [
      member.name, formatDate(member.expiryDate), payLink
    ]);
    await logNotification(member._id, 'member', 'whatsapp', 'expiry_reminder');
  }
}
```

**Step 5 — Fallback Strategy**
- If WhatsApp delivery fails → retry once after 30 min
- If still fails → send SMS via **Textlocal** (₹0.15/SMS) or **MSG91**
- Email fallback via **Resend.com** (free 3,000 emails/month)

---

## 6. PAYMENT INTEGRATION (Razorpay)

### Why Razorpay?
- ✅ Best for India (UPI, cards, net banking)
- ✅ Payment Links API (no checkout page needed)
- ✅ Webhooks for status updates
- ✅ 2% transaction fee (no monthly charge on starter)

### Flow Diagram
```
Admin clicks "Send Renewal Link"
       ↓
POST /api/payments/create-link
       ↓
Razorpay API → Creates Payment Link (expires in 7 days)
       ↓
Link sent to member via WhatsApp
       ↓
Member pays → Razorpay webhook fires
       ↓
POST /api/payments/webhook (verify signature)
       ↓
Update member.paymentStatus = 'paid'
Update member.expiryDate += plan duration
Send confirmation WhatsApp message
```

### Key Code Snippets

```javascript
// Create payment link
import Razorpay from 'razorpay';
const rzp = new Razorpay({ 
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});

export async function createPaymentLink(member, plan) {
  const link = await rzp.paymentLink.create({
    amount: plan.price * 100,  // paise
    currency: 'INR',
    description: `${plan.name} Membership - ${member.name}`,
    customer: { name: member.name, contact: `+91${member.phone}` },
    notify: { sms: false, email: false },  // we handle via WA
    reminder_enable: false,
    callback_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    callback_method: 'get',
    expire_by: Math.floor(Date.now() / 1000) + 7 * 86400  // 7 days
  });
  return link.short_url;
}

// Verify webhook
import crypto from 'crypto';
export function verifyWebhook(body, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  return expected === signature;
}
```

---

## 7. TOURNAMENT MODULE (Detailed Design)

### Design Decision: Build vs Integrate
**Recommendation: Build a lightweight custom system**
- Challonge/Battlefy APIs are over-engineered for a local academy
- Building knockout brackets is ~200 lines of logic
- You control the data, UI, and public display

### Bracket Generation Algorithm (Knockout)

```javascript
// utils/tournament.js

export function generateKnockoutFixtures(registrations, categoryId) {
  // Shuffle for random seeding
  const players = shuffle([...registrations]);
  
  // Pad to next power of 2 (byes for empty slots)
  const slots = nextPowerOf2(players.length);
  while (players.length < slots) players.push(null); // BYE
  
  const fixtures = [];
  let matchNumber = 1;
  const totalRounds = Math.log2(slots);
  
  // Round 1 fixtures
  for (let i = 0; i < slots; i += 2) {
    fixtures.push({
      round: 1,
      matchNumber: matchNumber++,
      player1Id: players[i]?._id || null,
      player2Id: players[i+1]?._id || null,
      status: (!players[i] || !players[i+1]) ? 'walkover' : 'scheduled',
      winnerId: !players[i] ? players[i+1]?._id : !players[i+1] ? players[i]?._id : null
    });
  }
  
  // Placeholder fixtures for subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = slots / Math.pow(2, round);
    for (let m = 0; m < matchesInRound; m++) {
      fixtures.push({ round, matchNumber: matchNumber++, status: 'pending' });
    }
  }
  
  return fixtures;
}

// After a match result is saved, advance winner
export function advanceWinner(fixtures, completedFixture) {
  const { round, matchNumber, winnerId } = completedFixture;
  const nextMatchIndex = Math.ceil(matchNumber / 2);
  const nextFixture = fixtures.find(f => f.round === round + 1 && f.matchNumber === nextMatchIndex);
  
  if (!nextFixture) return; // final match, tournament over
  
  if (matchNumber % 2 === 1) {
    nextFixture.player1Id = winnerId;
  } else {
    nextFixture.player2Id = winnerId;
  }
  if (nextFixture.player1Id && nextFixture.player2Id) {
    nextFixture.status = 'scheduled';
  }
}
```

### Public Bracket Display

```
        ┌─────────────────────────────────────────────┐
        │         SUMMER OPEN 2025 — MEN'S SINGLES    │
        │              [Live Bracket]                  │
        └─────────────────────────────────────────────┘
        
  QF          SF         Final       Winner
  ─────       ────       ─────       ──────
  Ravi ─┐
        ├─ Ravi ─┐
  BYE  ─┘        │
                  ├─ Ravi ─┐
  Suresh ─┐       │         │
           ├─ Suresh        ├─ ???
  Karan ──┘               │
                  ┌─ Kumar─┘
  Kumar ─┐        │
          ├─ Kumar
  Arun ──┘
```

Use **react-tournament-bracket** library or build with CSS grid — both work well.

### Tournament Data Flow
```
1. Admin creates tournament + categories
2. Registration opens (public form or admin entry)
3. Admin closes registration → clicks "Generate Fixtures"
4. System shuffles players, creates fixture documents
5. Staff/Admin updates scores → winner auto-advances to next round
6. Public bracket page updates in near-realtime (polling every 30s or SWR)
7. Final result saved → leaderboard shows winner/runner-up
```

### League Format (Phase 2)
For round-robin: each player plays every other player once.
Standings table: Wins × 2 pts, Loss × 0 pts.
Use `n*(n-1)/2` matches formula for scheduling.

---

## 8. DEPLOYMENT PLAN (Step-by-Step)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Vercel account (free)
- Razorpay account (test mode first)
- WATI/Interakt account

### Step 1 — Initialize Project
```bash
npx create-next-app@latest smash-univerz-app --typescript --tailwind --app
cd smash-univerz-app
npm install mongoose next-auth razorpay @radix-ui/react-dialog lucide-react
```

### Step 2 — Environment Variables
Create `.env.local`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smashuniversz
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret

WATI_API_TOKEN=your_wati_token
WATI_API_ENDPOINT=https://live-server.wati.io

NEXT_PUBLIC_URL=https://yourdomain.vercel.app
CRON_SECRET=random-cron-secret
```

### Step 3 — Project Structure
```
smash-univerz-app/
├── app/
│   ├── (public)/          # Public-facing pages
│   │   ├── page.tsx       # Landing page (preserve current design)
│   │   └── tournament/[id]/bracket/page.tsx
│   ├── (admin)/           # Protected admin routes
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── tournaments/
│   │   └── payments/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── members/
│       ├── students/
│       ├── attendance/
│       ├── payments/
│       ├── tournaments/
│       └── cron/reminders/
├── lib/
│   ├── mongodb.ts
│   ├── whatsapp.ts
│   └── razorpay.ts
├── models/
│   ├── Member.ts
│   ├── Student.ts
│   ├── Batch.ts
│   ├── Attendance.ts
│   ├── Payment.ts
│   ├── Tournament.ts
│   └── Fixture.ts
└── components/
    ├── ui/
    ├── members/
    ├── attendance/
    └── tournament/bracket/
```

### Step 4 — Deploy to Vercel
```bash
# Push to GitHub first
git init && git add . && git commit -m "initial commit"
gh repo create smash-univerz-app --public --push

# Deploy
vercel --prod
# Add environment variables in Vercel dashboard
# Set custom domain (optional, free on Vercel)
```

### Step 5 — Configure Cron Job
`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Step 6 — Configure Razorpay Webhook
- Razorpay Dashboard → Webhooks → Add URL:
  `https://yourdomain.vercel.app/api/payments/webhook`
- Select events: `payment_link.paid`, `payment.failed`

### Step 7 — MongoDB Indexes (for performance)
```javascript
// Run once via MongoDB Compass or script
db.members.createIndex({ phone: 1 }, { unique: true });
db.members.createIndex({ expiryDate: 1 });
db.students.createIndex({ batchId: 1 });
db.attendance.createIndex({ date: 1, batchId: 1 });
db.fixtures.createIndex({ tournamentId: 1, round: 1 });
```

---

## 9. COST ESTIMATION (Monthly)

| Service | Free Tier | Paid Plan | Notes |
|---------|-----------|-----------|-------|
| **Vercel** | Free (hobby) | $20/month (Pro) | Free is enough for MVP |
| **MongoDB Atlas** | M0 Free (512MB) | M2 = $9/month | Free tier 6–12 months |
| **Razorpay** | No monthly fee | 2% per transaction | ₹30 on ₹1,500 plan |
| **WATI WhatsApp** | 7-day trial | ₹2,499/month | OR use Meta API direct |
| **Interakt (alt)** | — | ₹799/month | Cheaper alternative |
| **Meta Cloud API** | Free | ~₹0.60/conversation | After 1000 free/month |
| **Textlocal SMS** | — | ₹0.15/SMS | Fallback only |
| **Resend (email)** | 3,000/month free | $20/month | Free tier sufficient |
| **Cloudinary** | 25 credits free | $89/month | Images only, free OK |

### Realistic MVP Monthly Cost
```
Scenario: 100 members, 50 students, 2 tournaments/year

Vercel:          ₹0    (free hobby)
MongoDB Atlas:   ₹0    (free M0 tier)
Razorpay:        ₹0    (% only, ~₹150–₹300/month in fees)
Meta Cloud API:  ~₹300 (500 conversations × ₹0.60)
SMS fallback:    ~₹30  (200 SMS × ₹0.15)
Email (Resend):  ₹0    (free tier)

TOTAL:  ~₹300–₹600/month (under ₹1,000 easily)
```

---

## 10. RECOMMENDED BUILD ORDER

```
Week 1:  Project setup, Auth, Member CRUD, basic dashboard
Week 2:  Student management, Batch management, Attendance
Week 3:  Razorpay payment links, basic WhatsApp integration
Week 4:  Tournament module (create, register, generate fixtures)
Week 5:  Score updates, bracket display, cron reminders
Week 6:  Staff panel, testing, polish, deploy to production
```

---

## QUICK START COMMAND SEQUENCE

```bash
# 1. Create project
npx create-next-app@latest smash-univerz-app --typescript --tailwind --app --src-dir

# 2. Install dependencies
cd smash-univerz-app
npm install mongoose next-auth@beta razorpay
npm install @radix-ui/react-dialog @radix-ui/react-select lucide-react
npm install date-fns zod react-hook-form @hookform/resolvers

# 3. Start dev server
npm run dev
```

---

*This document is your single source of truth. Migrate your existing landing page content into the Next.js `app/(public)/page.tsx` and build admin routes under `app/(admin)/`.*
