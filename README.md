# 🔐 Vault

> A minimalist, password-protected personal vault — built to securely store code snippets, secrets, and files behind hidden access URLs. Supports **3 fully isolated vaults**, each with its own data, sessions, and access key.

---

## ✨ Features

- **Hidden entry point** — The site shows a deliberately "broken" error page to the public. Only those with the secret URL can even see the login screen.
- **3 isolated vaults** — Three completely separate vaults, each with their own data, sessions, and access key.
- **Shared password** — One password unlocks all 3 vaults. Each vault maintains its own session independently.
- **Secure PDF viewer** — Drop a PDF into `public/doc.pdf` and access it session-gated via `/api/pdf`. Direct URL access returns `404`.
- **Password authentication** — Session-based login with bcrypt-hashed password and lockout after failed attempts.
- **Code snippet storage** — Store titled code snippets with one-click copy-to-clipboard.
- **Image attachments** — Upload and attach images to any vault item, stored in MongoDB GridFS.
- **Terminate other sessions** — Kick all other active sessions while keeping your own alive.
- **Emergency kill switch** — Master key endpoint to wipe every single session instantly.
- **Minimal, terminal-style UI** — Monospace, no-nonsense interface inspired by old-school system terminals.

---

## 🛠️ Tech Stack

| Layer       | Technology                       |
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
SECRET_ACCESS_KEY=your_key_for_vault1
VAULT2_ACCESS_KEY=your_key_for_vault2
VAULT3_ACCESS_KEY=your_key_for_vault3
MASTER_RESET_KEY=your_master_reset_key
```

> ⚠️ **Never commit `.env.local` to version control.** It is already excluded by `.gitignore`.

### 4. Set up the initial user

```bash
npm run setup
```

This runs the setup script to create your initial authenticated user in MongoDB.

### 5. (Optional) Add your secure PDF

Place a PDF file at:

```
public/doc.pdf
```

It will only be accessible through the session-gated `/api/pdf` endpoint — never directly.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Accessing the Vaults

The homepage intentionally displays a fake "system error" page. To access a vault, navigate to its **secret URL**:

| Vault   | Access URL                          |
|---------|-------------------------------------|
| Vault 1 | `http://localhost:3000/?key=<SECRET_ACCESS_KEY>`  |
| Vault 2 | `http://localhost:3000/?key=<VAULT2_ACCESS_KEY>`  |
| Vault 3 | `http://localhost:3000/?key=<VAULT3_ACCESS_KEY>`  |

- All 3 vaults use the **same password** but have completely **isolated data and sessions**.
- Logging into Vault 1 does **not** log you into Vault 2 or 3.
- Data added in one vault is **never visible** in the others.

---

## 📁 Project Structure

```
vault/
├── public/
│   └── doc.pdf                  # Your secure PDF (not publicly accessible)
├── pages/
│   ├── index.tsx                # All 3 vault views (Broken / Login / Vault)
│   ├── _app.tsx                 # Next.js app wrapper
│   ├── _document.tsx            # Custom HTML document
│   └── api/
│       ├── auth/
│       │   ├── login.ts         # Vault 1 login
│       │   ├── login2.ts        # Vault 2 login
│       │   ├── login3.ts        # Vault 3 login
│       │   ├── logout.ts        # Vault 1 logout
│       │   ├── logout2.ts       # Vault 2 logout
│       │   ├── logout3.ts       # Vault 3 logout
│       │   └── terminate-others.ts  # Kill all other sessions (vault-aware)
│       ├── vault/               # CRUD endpoints for Vault 1 items
│       ├── vault2/              # CRUD endpoints for Vault 2 items
│       ├── vault3/              # CRUD endpoints for Vault 3 items
│       ├── pdf.ts               # Session-gated PDF server
│       ├── upload.ts            # Image upload (GridFS)
│       ├── photo.ts             # Image retrieval (GridFS)
│       └── kill-session.ts      # Emergency: wipe all sessions (master key)
├── lib/
│   ├── db.ts                    # MongoDB connection helper
│   ├── gridfs.ts                # GridFS setup for image storage
│   └── session.ts               # Session creation, validation & termination
├── scripts/
│   └── setup-user.ts            # Initial user setup script
├── middleware.ts                 # Security headers
├── .env.local                   # ← NOT committed (see .gitignore)
└── .gitignore
```

---

## 📦 API Endpoints

| Method   | Endpoint                       | Description                              |
|----------|--------------------------------|------------------------------------------|
| `POST`   | `/api/auth/login`              | Authenticate → sets `vault_token`        |
| `POST`   | `/api/auth/login2`             | Authenticate → sets `vault2_token`       |
| `POST`   | `/api/auth/login3`             | Authenticate → sets `vault3_token`       |
| `POST`   | `/api/auth/logout`             | Destroy Vault 1 session                  |
| `POST`   | `/api/auth/logout2`            | Destroy Vault 2 session                  |
| `POST`   | `/api/auth/logout3`            | Destroy Vault 3 session                  |
| `POST`   | `/api/auth/terminate-others`   | Kill all other sessions (keep own alive) |
| `GET`    | `/api/vault/items`             | Fetch Vault 1 items                      |
| `POST`   | `/api/vault/items`             | Create Vault 1 item                      |
| `DELETE` | `/api/vault/items?id=...`      | Delete Vault 1 item                      |
| `GET`    | `/api/vault2/items`            | Fetch Vault 2 items                      |
| `POST`   | `/api/vault2/items`            | Create Vault 2 item                      |
| `DELETE` | `/api/vault2/items?id=...`     | Delete Vault 2 item                      |
| `GET`    | `/api/vault3/items`            | Fetch Vault 3 items                      |
| `POST`   | `/api/vault3/items`            | Create Vault 3 item                      |
| `DELETE` | `/api/vault3/items?id=...`     | Delete Vault 3 item                      |
| `GET`    | `/api/pdf`                     | Serve `doc.pdf` (session-gated)          |
| `POST`   | `/api/upload`                  | Upload an image to GridFS                |
| `GET`    | `/api/photo?id=...`            | Stream an image from GridFS              |
| `POST`   | `/api/kill-session`            | Emergency: wipe ALL sessions (master key)|

---

## 🔒 Security Notes

- The vault requires a **secret query-string key** to even show the login form — there is no discoverable login page.
- Passwords are hashed with **bcrypt**. Failed logins trigger a **24-hour lockout** after 2 attempts.
- Sessions are stored as **HttpOnly cookies** and validated server-side on every request.
- Each vault uses its **own session collection** — sessions are fully isolated.
- The PDF (`/api/pdf`) is **never publicly accessible** — it requires a valid session and returns `404` otherwise.
- All environment secrets must be kept out of version control.
- The `[ TERMINATE OTHER SESSIONS ]` button lets you kick out anyone else logged into the same vault while staying logged in yourself.
- The `/api/kill-session` endpoint (protected by `MASTER_RESET_KEY`) is a nuclear option that wipes every session across the entire system.

---

## 📜 License

MIT — use freely, but keep your secrets safe.

---

<div align="center">
  <sub>Built with ☕ and paranoia. By Omkar Parelkar</sub>
</div>
