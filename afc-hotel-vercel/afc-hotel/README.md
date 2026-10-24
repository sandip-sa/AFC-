# 🏨 AFC Hotel & Restaurant — Website

A complete hotel & restaurant website for **AFC Hotel, Golbazar-4, Siraha, Nepal** — built with pure **HTML, CSS & JavaScript** (no frameworks needed).

## 🚀 How to run

Just open `index.html` in any browser, or serve the folder:

```bash
cd afc-hotel
python3 -m http.server 8000
# → http://localhost:8000
```

## 🔑 Admin Login

Open **`admin.html`** (or click **Admin** in the website navigation).

| Field    | Default    |
|----------|------------|
| Username | `admin`    |
| Password | `afc@123`  |

> Change the username/password any time in **Admin → Settings → Admin account**.

## ⭐ Features

### Public website (`index.html`)
- Premium dark-luxury gold theme with your hotel's details, photos & story
- **Full menu from your PDF** — 246 items, all categories, variants (e.g. Tea Milk/Black/Lemon, liquor bottle sizes 60–750 ml)
- Search, veg-only filter & category browsing
- **Online ordering** — cart drawer, checkout for 🛵 Delivery / 🥡 Takeaway / 🍽️ Dine-in
- Delivery fee logic (free delivery above Rs. 1,000 — configurable)
- **Room booking** (3 room types) & **table reservation** forms
- **Live order tracking** — customers watch status update in real time
- Contact section with phone, email, Facebook & address links

### Admin dashboard (`admin.html`)
- 📊 **Overview** — today's revenue, orders, pending counts, 7-day revenue chart, top-selling items
- 🧾 **Live Orders** — new website orders appear **instantly** with a notification; progress orders through *Pending → Accepted → Preparing → Out/Ready → Completed* (customer's tracking page updates live)
- 📅 **Bookings** — confirm / cancel / complete room & table bookings, one-tap call
- 🍽️ **Menu Manager** — add / edit / delete items, single price **or** variants, veg & popular flags, one-tap availability toggle (sold-out items show on the site immediately)
- 🛏️ **Rooms** — add / edit / remove room types & prices
- ⚙️ **Settings** — edit hotel name, contacts, address, hero text, about, notice banner, delivery fees, admin password; load demo data or reset everything

### Real-time sync
Data is stored in the browser's `localStorage`. Open the website and the admin panel side by side — **every admin edit appears on the website instantly**, and new customer orders pop into the admin dashboard in real time (uses cross-tab storage events).

> ⚠️ Because this is a pure front-end build, data lives per-browser (great for demo & single-device use). For multi-device production use you'd connect the same UI to a backend (Firebase, Node, etc.) — the data layer in `js/data.js` is the single place to swap.

## 📁 Structure

```
afc-hotel/
├── index.html         # Public website
├── admin.html         # Admin login + dashboard
├── css/
│   ├── style.css      # Public site styles
│   └── admin.css      # Dashboard styles
├── js/
│   ├── data.js        # Data layer + full menu (from your PDF)
│   ├── app.js         # Public site logic
│   └── admin.js       # Dashboard logic
└── assets/            # Photos (hero, about, food, room)
```

## 📞 Hotel details

**AFC Hotel** · Golbazar-4, Siraha, Nepal, 56500
📞 033-540487 · ✉️ shahparash07@gmail.com · 👍 facebook.com/afchotel
*"Your Satisfaction is Our Goal"*
