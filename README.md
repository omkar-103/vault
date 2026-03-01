# 🔐 Vault

> A minimalist, password-protected personal code vault — built to securely store snippets, secrets, and screenshots behind a hidden access URL.

---

## ✨ Features

- **Hidden entry point** — The site shows a deliberately "broken" error page to the public. Only those with the secret URL can even see the login screen.
- **Password authentication** — Session-based login with bcrypt-hashed password verification.
- **Code snippet storage** — Store titled code snippets with one-click copy-to-clipboard.
- **Image attachments** — Upload and attach images to any vault item, stored in MongoDB GridFS.
- **Kill switch** — Emergency session termination endpoint.
- **Minimal, terminal-style UI** — Monospace, no-nonsense interface inspired by old-school system terminals.

---

## 🛠️ Tech Stack

| Layer       | Technology                      |
|-------------|----------------------------------|
| Framework   | [Next.js 14](https://nextjs.org) |
| Language    | TypeScript                       |
| Database    | MongoDB Atlas + GridFS           |
| Auth        | Cookie sessions + bcryptjs       |
| Styling     | Inline CSS (Courier monospace)   |
| Runtime     | Node.js                          |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/omkar-103/vault.git
cd vault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```env
MONGODB_URI=your_mongodb_connection_string
SECRET_ACCESS_KEY=your_secret_url_key
MASTER_RESET_KEY=your_master_reset_key
```

> ⚠️ **Never commit `.env.local` to version control.** It is already excluded by `.gitignore`.

### 4. Set up the initial user

```bash
npm run setup
```

This runs the setup script to create your initial authenticated user in MongoDB.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Accessing the Vault

The homepage intentionally displays a fake "system error" page. To access the login screen, navigate to the **secret URL**:

```
http://localhost:3000/?sys=repair&mode=legacy&key=YOUR_SECRET_ACCESS_KEY
```

Replace `YOUR_SECRET_ACCESS_KEY` with the value of `SECRET_ACCESS_KEY` from your `.env.local`.

---

## 📁 Project Structure

```
vault/
├── pages/
│   ├── index.tsx          # Main page (Broken / Login / Vault views)
│   ├── _app.tsx           # Next.js app wrapper
│   ├── _document.tsx      # Custom HTML document
│   └── api/
│       ├── auth/          # Login & logout endpoints
│       ├── vault/         # CRUD endpoints for vault items
│       ├── upload.ts      # Image upload (GridFS)
│       ├── photo.ts       # Image retrieval (GridFS)
│       └── kill-session.ts # Emergency session termination
├── lib/
│   ├── db.ts              # MongoDB connection helper
│   ├── gridfs.ts          # GridFS setup for image storage
│   └── session.ts         # Session creation & validation
├── scripts/
│   └── setup-user.ts      # Initial user setup script
├── middleware.ts           # Next.js middleware
├── .env.local             # ← NOT committed (see .gitignore)
└── .gitignore
```

---

## 📦 API Endpoints

| Method   | Endpoint                  | Description                        |
|----------|---------------------------|------------------------------------|
| `POST`   | `/api/auth/login`         | Authenticate with password         |
| `POST`   | `/api/auth/logout`        | Destroy session cookie             |
| `GET`    | `/api/vault/items`        | Fetch all vault items              |
| `POST`   | `/api/vault/items`        | Create a new vault item            |
| `DELETE` | `/api/vault/items?id=...` | Delete a vault item                |
| `POST`   | `/api/upload`             | Upload an image to GridFS          |
| `GET`    | `/api/photo?id=...`       | Stream an image from GridFS        |
| `POST`   | `/api/kill-session`       | Emergency session kill             |

---

## 🔒 Security Notes

- The vault requires a **secret query-string key** to even show the login form.
- Passwords are hashed with **bcrypt**.
- Sessions are stored as signed cookies.
- All environment secrets must be kept out of version control.

---

## 📜 License

MIT — use freely, but keep your secrets safe.

---

<div align="center">
  <sub>Built with ☕ and paranoia. By Omkar Parelkar </sub>
</div>
