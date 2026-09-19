# Multi-Vendor Marketplace

A full-stack multi-vendor ecommerce marketplace built to demonstrate real-world engineering depth: JWT auth with token rotation, concurrency-safe inventory management, Meilisearch product search, Stripe payments, and content-based recommendations.

**Tech stack:** React (Vite) · Node.js/Express · MongoDB · Meilisearch · Stripe (test mode)

---

## 1. Project Structure

```
marketplace/
├── backend/          # Express API
├── frontend/         # React (Vite) app
├── docker-compose.yml  # Local Meilisearch
└── README.md
```

# How to Run This Website — Full Setup Guide

This guide is written for someone who has never run this project before and doesn't know what needs to happen behind the scenes. Follow **Part 1** the very first time you set this up. Every time after that (e.g. after restarting your laptop), just follow **Part 2**.

---

**# PART 1 — First-Time Setup (do this once)**

## Step 1 — Install the required programs

Install these one by one. Each is a normal Windows installer — download, run, click through.

1. **Node.js** — https://nodejs.org (choose the LTS version)
   - After installing, verify it worked by opening PowerShell and running:
     ```powershell
     node -v
     npm -v
     ```
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop
   - Install it, then open it once. It needs to stay running in the background whenever you use this website (its icon will sit in your system tray).
   - If it asks you to enable WSL2, open PowerShell **as Administrator** and run:
     ```powershell
     wsl --install
     ```
     Then restart your PC and reopen Docker Desktop.
3. **Stripe CLI** — https://github.com/stripe/stripe-cli/releases/latest
   - Download the Windows zip, extract it anywhere (e.g. `C:\Users\<you>\Downloads\stripe-cli\`), and keep the extracted folder — don't delete it.
4. **A MongoDB Atlas account** (free) — https://cloud.mongodb.com
   - Create a free cluster, create a database user (username + password), and under "Network Access" allow access from anywhere (`0.0.0.0/0`) for simplicity during development.
   - Copy your connection string (**Connect → Drivers**) — you'll need it in Step 4.
5. **A Stripe account** (free, test mode) — https://dashboard.stripe.com
   - Make sure "Test mode" is turned ON (toggle top-right of the dashboard).

## Step 2 — Generate your secret keys

Open PowerShell anywhere and run this **twice** — copy each result somewhere safe (Notepad), you'll need them in Step 4:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Step 3 — Start Meilisearch (the search engine) via Docker

Make sure Docker Desktop is open and running, then:

```powershell
**in the root folder**
docker-compose up -d
```

## Step 4 — Set up the backend

```powershell
**in the backend folder**
npm install
copy .env.example .env
notepad .env
```

In the Notepad window that opens, fill in:
- `MONGO_URI` → your MongoDB Atlas connection string (from Step 1.4)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` → the two values from Step 2
- `MEILI_HOST=http://localhost:7700`
- `MEILI_API_KEY` → same value as `MEILI_MASTER_KEY` in `docker-compose.yml` (default is `dev_master_key_change_me`)
- `STRIPE_SECRET_KEY` → from https://dashboard.stripe.com/test/apikeys (starts with `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` → leave blank for now, you'll fill this in Step 5

Save and close Notepad.

## Step 5 — Connect Stripe

**5a. Log in to the Stripe CLI (one-time):**
```powershell
**in the stripe-cli folder**
.\stripe.exe login
```
This opens your browser to confirm — click "Allow access" there. You won't need to do this again.

**5b. Start the webhook listener** (this needs to run every time you use the site — see Part 2):
```powershell
.\stripe.exe listen --forward-to localhost:5000/api/webhooks/stripe
```
It will print something like `Your webhook signing secret is whsec_...` — copy that value into `backend\.env` as `STRIPE_WEBHOOK_SECRET`. **Keep this terminal window open** — closing it stops the connection.

## Step 6 — Seed demo data (optional but recommended)

In a **new** terminal window:
```powershell
**in the backend folder**
npm run seed
```
This creates demo shops, products, a buyer account, and 3 seller accounts (all using password `password123`) so you have something to test with immediately.

## Step 7 — Start the backend server

Still in the backend folder:
```powershell
npm run dev
```
**Keep this terminal window open** while using the site.

## Step 8 — Set up and start the frontend

In a **new** terminal window:
```powershell
**in the frontend folder**
npm install
copy .env.example .env
notepad .env
```
Fill in `VITE_STRIPE_PUBLISHABLE_KEY` (from the same Stripe API keys page, the `pk_test_...` one). Leave `VITE_API_URL` as-is. Save and close.

Then start it:
```powershell
npm run dev
```
**Keep this terminal window open** too.

## Step 9 — Open the website

Go to **http://localhost:5173** in your browser. You're done!

---

**# PART 2 — Starting the Website Again (every time after the first setup)**

You already have everything installed and your `.env` files are already filled in. You just need to turn everything back on. Do these in order.

## 1. Open Docker Desktop
Just double-click the Docker Desktop app and wait for it to fully start (whale icon steady in the system tray, no longer animating).

## 2. Start Meilisearch
```powershell
**in the root folder**
docker-compose up -d
```

## 3. Start the Stripe webhook listener (own terminal window — keep it open)
```powershell
**in the stripe-cli folder**
.\stripe.exe listen --forward-to localhost:5000/api/webhooks/stripe
```
⚠️ **Important:** this generates a **new** `whsec_...` value every time you run it. If it's different from what's currently in `backend\.env`, update `STRIPE_WEBHOOK_SECRET` with the new value and restart the backend (Step 4 below) — otherwise payments won't confirm properly.

*(Tip: if you never close this terminal window between sessions, the key stays the same and you can skip the update.)*

## 4. Start the backend (own terminal window — keep it open)
```powershell
**in the backend folder**
npm run dev
```

## 5. Start the frontend (own terminal window — keep it open)
```powershell
**in the frontend folder**
npm run dev
```

## 6. Open the website
Go to **http://localhost:5173**

---

## Quick Reference — What Needs to Stay Running

While using the website, you should have all of these open at the same time:

| # | What | Where | Stays open? |
|---|------|-------|-------------|
| 1 | Docker Desktop | Desktop app | Yes, in background |
| 2 | Meilisearch | Started via `docker-compose up -d` (no visible window) | Runs in background automatically |
| 3 | Stripe webhook listener | Terminal window | Yes, must stay open |
| 4 | Backend server | Terminal window | Yes, must stay open |
| 5 | Frontend server | Terminal window | Yes, must stay open |

If you close any of the terminal windows (3, 4, or 5), that part of the site stops working until you restart it with its command above.

## Troubleshooting Quick Checks

- **Backend not responding?** Visit `http://localhost:5000/api/health` — should show `{"success":true,"message":"API is running"}`. If not, check the backend terminal for errors.
- **Search not returning results?** Make sure Docker/Meilisearch is running (`docker ps` should show a `meilisearch` container as `Up`).
- **Payments stuck as "pending"?** The Stripe webhook listener probably isn't running, or its `whsec_...` key doesn't match what's in `backend\.env`.







**Demo accounts (all use password `password123`):**
| Role | Email | Shop |
|---|---|---|
| Buyer | `buyer@demo-shop.test` | — |
| Seller | `elena@demo-shop.test` | Terra & Clay Ceramics |
| Seller | `marcus@demo-shop.test` | Northline Audio |
| Seller | `priya@demo-shop.test` | Fernwood Botanicals |

Log in as the buyer to browse/search/purchase, or as a seller to see their dashboard and stats.

## 9. Try It End to End

1. Run the seed script above, or manually: register as a **seller** → you'll be redirected to shop setup → create your shop → add products from the seller dashboard.
2. Log out, log in as the demo buyer (or register a new buyer / open an incognito window).
3. Browse/search products, add to cart, checkout with the Stripe test card.
4. Back in a seller dashboard, see the order appear and update its fulfillment status.
5. To test admin features, manually set a user's `role` to `"admin"` in MongoDB Atlas (no self-serve admin signup, by design).

**## Deployment ##**

### Frontend → Vercel
1. Push this repo to GitHub.
2. Import the `frontend/` directory as a new Vercel project (set root directory to `frontend`).
3. Set environment variables in Vercel: `VITE_API_URL` (your Render backend URL + `/api`), `VITE_STRIPE_PUBLISHABLE_KEY`.
4. Deploy.

### Backend → Render
1. Create a new Web Service on Render, root directory `backend`.
2. Build command: `npm install`. Start command: `npm start`.
3. Set all environment variables from `backend/.env.example` in Render's dashboard, using production values.
4. Set `CLIENT_URL` to your deployed Vercel URL (for CORS).
5. After deploying, update your Stripe webhook endpoint (in the Stripe Dashboard, not the CLI) to point to `https://<your-render-app>.onrender.com/api/webhooks/stripe`, and copy the new webhook signing secret into Render's env vars.

### Database → MongoDB Atlas
Already hosted — just make sure Atlas's Network Access allows connections from Render (or use `0.0.0.0/0` for simplicity, tightening later).

### Search → Meilisearch
Use [Meilisearch Cloud](https://www.meilisearch.com/cloud) (has a free tier) or deploy the same Docker image to a small Render/VPS instance. Update `MEILI_HOST`/`MEILI_API_KEY` in your backend's production env vars.

### Payments → Stripe
Stay in test mode for a portfolio project — no need to activate live payments unless you want to accept real money.

## 11. Key Engineering Highlights (for your CV / interview talking points)

- **Concurrency-safe inventory** (`backend/src/services/inventory.js`): uses atomic, conditional MongoDB updates (`findOneAndUpdate` with a `stock >= quantity` filter) instead of read-then-write, preventing overselling when multiple buyers check out simultaneously. Multi-item orders use a compensating-transaction pattern to roll back partial stock reservations if any item fails.
- **Payment-confirmed stock decrement**: stock is never reserved at "checkout click" — only once Stripe's webhook confirms `payment_intent.succeeded`, so abandoned carts never lock up inventory.
- **JWT refresh token rotation**: each refresh issues a new token and invalidates the old one; reuse of a stale token wipes all sessions for that user (basic theft detection).
- **Content-based recommendations** (`backend/src/services/recommendation.js`): category/tag-overlap scoring for "similar products" and purchase-history-based "for you" feeds — no ML infra required, but demonstrates recommendation-system thinking.
- **Search sync service**: keeps Meilisearch in sync with MongoDB writes without making search availability a hard dependency for core CRUD operations (search failures are logged, not thrown).
