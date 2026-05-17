# WordMaster — Flashcard Vocabulary Learning App

A full-stack single-page web application for collecting, reviewing, and mastering vocabulary, with a daily check-in streak system and a "wordbook" collection mechanic. Designed around a pastel, illustrative aesthetic centred on a scholarly unicorn mascot.

**Assignment 2 submission for 31748 / 32516 — Web Programming.**

---

## The problem this solves

Most vocabulary apps either feel like spreadsheets (boring, no sense of progress) or like games where you don't own your own word list. WordMaster sits in between: you build a personal flashcard deck (Create / Read / Update / Delete), and the app gives that deck a sense of momentum — daily check-ins with a streak counter, a "wordbook" you watch fill up, and a flip-card review loop with celebratory animations. It's a personal, lightweight learning tool with the polish of a consumer app.

---

## Live features

### Core learning loop
- **Sign up / log in** with bcrypt-hashed passwords and JWT auth (access + refresh tokens)
- **Add flashcards** (word, meaning, example sentence) — *Create*
- **Browse & live-search** flashcards by word or meaning in real time — *Read*
- **3D flip cards** to reveal meanings, with a rainbow halo glow and 12-particle sparkle burst per flip
- **Mark mastered** — *Update*; mastered cards animate along a curved arc into the wordbook
- **Batch mastering**: tap "Select", multi-select cards, then send them all to the wordbook in one go
- **Delete** word — *Delete*

### Daily check-in (gamification)
- One-tap check-in button on the dashboard
- Confetti burst celebration on a fresh check-in (28 coloured particles)
- Rainbow monthly calendar — each weekday has its own colour (Sun→Sat = red→violet)
- Consecutive-day **streak** counter + total days tracker
- Idempotent: re-checking on the same day is a no-op (enforced at the database via `UNIQUE` constraint)

### My Wordbook
- Visual "deck of cards" on the dashboard right side
- **Hover** to fan the cards out like a poker hand
- Click to open a full-screen wordbook view of all mastered words
- Each mastered word displayed as a **rainbow-shimmer card** with an animated diagonal sheen
- Flip a mastered card to find **Un-master** (returns it to active learning) or **Delete** actions
- Floating gold crown decoration on the wordbook button

### Account management
- Users can delete their own account via the navbar dropdown (cascades to delete their words, history, and check-ins)
- **Admin panel**: tabbed interface for browsing all users (with word/check-in counts per user) or activity history
- Admins can delete non-admin users with a confirmation dialog; admin accounts are protected

### UX polish
- Toast notifications (sonner) replace all `alert()` calls
- Loading skeletons during data fetch
- Empty states featuring the unicorn mascot
- Smooth page transitions and motion via Framer Motion
- Fully responsive — mobile + desktop layouts
- Route guards: `/dashboard` and `/admin` redirect to login if no valid token

---

## CRUD coverage

The assignment requires CRUD on at least three entities. WordMaster covers four:

| Entity     | Create              | Read                  | Update              | Delete              |
| ---------- | ------------------- | --------------------- | ------------------- | ------------------- |
| user       | `POST /register`    | `POST /login`         | (managed via JWT)   | `DELETE /account` + `DELETE /admin/users/<id>` |
| vocabulary | `POST /words`       | `GET /words` + live search | `PUT /words/<id>`   | `DELETE /words/<id>` |
| history    | auto on word ops    | `GET /admin/history`  | (immutable audit log) | cascade on user delete |
| check_ins  | `POST /checkin`     | `GET /checkin`        | (idempotent insert) | cascade on user delete |

---

## Tech stack

**Frontend**
- React 18 + React Router 6 (SPA, all navigation client-side)
- Vite 5 (build tool, fast dev server)
- Tailwind CSS v4 (design tokens + utility classes)
- Framer Motion (entrance / exit / spring animations)
- lucide-react (icon set)
- sonner (toast notifications)
- axios (HTTP client with interceptors for auth)

**Backend**
- Flask 3 (REST API)
- flask-jwt-extended (JWT issuance + verification)
- flask-bcrypt (password hashing)
- flask-cors (cross-origin requests from Vite dev server)
- SQLite (single-file database, four tables)

---

## How to run

### Backend (terminal 1)

```bash
cd backend
python -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                      # http://127.0.0.1:5000
```

For production, set a stable JWT secret via environment variable first:
```bash
export JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
```

### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

Then open http://localhost:5173.

---

## Project structure

```
WordMaster/
├── backend/
│   ├── app.py                 Flask API: auth, words, history, check-ins, admin
│   ├── requirements.txt       Python dependencies
│   └── vocab.db               SQLite database (4 tables: users, vocabulary, history, check_ins)
├── frontend/
│   ├── public/
│   │   ├── mascot.png         Unicorn mascot (transparent PNG)
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddWordModal.jsx        Add-word form modal with validation
│   │   │   ├── CheckinButton.jsx       Daily check-in + rainbow calendar modal + confetti
│   │   │   ├── ConfirmDialog.jsx       Reusable destructive-action confirmation
│   │   │   ├── Mascot.jsx              Unicorn PNG wrapper
│   │   │   ├── Navbar.jsx              Top bar + user-menu dropdown
│   │   │   ├── StatCard.jsx            Reusable stat card (used in Dashboard + Admin)
│   │   │   ├── WordbookButton.jsx      Wordbook pocket + fan preview + rainbow card modal
│   │   │   └── WordCard.jsx            Flip card with halo + particle burst
│   │   ├── lib/
│   │   │   └── api.js                  Axios client with auth + refresh-token interceptors
│   │   ├── pages/
│   │   │   ├── Admin.jsx               Tabbed Users / History view
│   │   │   ├── Dashboard.jsx           Main learning view + check-in + wordbook
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx                     Routes + auth guard
│   │   ├── index.css                   Tailwind import + design tokens + animation keyframes
│   │   └── main.jsx                    React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md                  This file
```

---

## Workload Allocation

Two-person group. Both members contributed across the stack; the breakdown below reflects primary ownership of each area.

### Kexin Liu (Student ID: 25951839) — Mainly responsible for backend development and foundational design system setup.
* **Original project framework (Assignment 1)** — the foundation everything else builds on, including the original Flask scaffolding, user-auth flow, and CRUD endpoints for the words table
* Backend Flask API in `backend/app.py` (route handlers, SQLite queries, request/response shape)
* Database schema in `backend/vocab.db` and `init_db()`
* README and project documentation (`README.md`)
* Tailwind design tokens (`frontend/src/index.css` colour variables, `.btn-pop` / `.card-pop` / `.input-pop` reusable patterns)
* Card interaction system:
  * Card flip animation with smooth front/back transition effects
  * Learned/unlearned state management and synchronization
  * Card deletion workflow with confirmation handling
  * Add/edit vocabulary card functionality with modal-based form interaction
* Authentication pages and logic:
  * User registration page implementation (`Register.jsx`)
  * User login page implementation (`Login.jsx`)
  * Form validation, authentication state handling, and API integration
* Video recording and demonstration of the application

### Yuexin Li (Student ID: 13157464) — Mainly responsible for frontend pages, components, animations, and visual effects.
- Frontend pages: `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `Admin.jsx`
- Reusable components:
  - `WordCard.jsx` (flip mechanic, particle burst, selection mode)
  - `WordbookButton.jsx` (fan-out deck preview, rainbow shimmer card, wordbook modal)
  - `CheckinButton.jsx` (daily check-in + rainbow weekday calendar + confetti)
  - `AddWordModal.jsx`, `ConfirmDialog.jsx`, `StatCard.jsx`, `Navbar.jsx`, `Mascot.jsx`
- Frontend axios client with token-refresh logic (`src/lib/api.js`)
- Card-flight animation (curved arc trajectory from learning grid to wordbook pocket)
- Sparkle particle and rainbow halo CSS keyframes
- Unicorn mascot image (sourcing + transparent-background preprocessing)
- New feature additions to the backend during v2 iteration: `check_ins` table, refresh-token endpoint, JWT hardening (HS256, env-var secret, explicit token expiry), account self-deletion endpoint, admin user-management endpoints, cascade-delete logic

This split was chosen so that one member focused on the platform foundation (backend, database, design system, docs) while the other built the visible product surface (every interactive screen, every animation, every micro-interaction). Both members reviewed each other's code through GitHub.

Workload is roughly **50% Kexin Liu / 50% Yuexin Li**. Both contributions are essential — the polished surface would not exist without the foundation, and the foundation alone would not meet the assignment's complexity bar.

---

## Technical Design Decisions

This section documents the key architectural choices and the reasoning behind each one. (Particularly relevant to the individual rubric criterion: "Rationale of technical/interface design.")

### 1. `useState` vs `useReducer` vs `useRef` — when each is used

All three React hooks are used in this codebase, deliberately for different purposes:

- **`useState`** is the default for any value that, when it changes, the UI should re-render. Examples: `words`, `search`, `filter`, `flipped`, `modalOpen`, `selectedIds`. The vast majority of state in this app is simple enough that `useState` keeps the code obvious.
- **`useReducer`** is *not* used because no piece of state in this app has enough interrelated transitions to justify it. `useReducer` shines when you have many actions (`ADD_X`, `REMOVE_X`, `RESET`, `TOGGLE_X` …) that all mutate the same shape; here, each piece of state has at most two or three callers and `useState` setters are clearer.
- **`useRef`** is used in three places where we explicitly *don't* want a re-render: (a) `cardRefs` in `Dashboard.jsx` maps word IDs to their DOM nodes so the fly-to-wordbook animation can read each card's `getBoundingClientRect()` at click time; (b) `wordbookRef` exposes an imperative handle (`triggerCatch`, `getRect`) on the wordbook component so the parent can synchronise animations; (c) `flipTimeoutRef` and `menuRef` hold setTimeout IDs and DOM nodes (for click-outside detection) that should persist between renders but never trigger one. These are cases where the value is "alive" but not "displayed".

This split keeps the rendering model clean: `useState` for what the user sees, `useRef` for what the user doesn't.

### 2. Centralised auth with Axios interceptors

Every authenticated API call goes through one `axios` instance defined in `src/lib/api.js`. Three pieces of cross-cutting logic are centralised there:

- A **request interceptor** automatically reads the JWT from `localStorage` and adds an `Authorization: Bearer <token>` header to every outgoing request.
- A **response interceptor** catches `401 Unauthorized` responses, **automatically tries to refresh the access token using the stored refresh token**, retries the original request once, and only redirects to login if the refresh also fails.
- A **request de-duplication guard** prevents two concurrent 401s from kicking off two simultaneous refreshes.

Without this, every page would need to manually read the token, attach the header, handle expired-token errors, and re-issue retries. Centralising it means auth logic lives in **one** place — any future endpoint inherits the correct behaviour, and changes (e.g. switching to HTTP-only cookies later) require editing one file instead of every page.

### 3. JWT for stateless authentication, with hardened crypto

Authentication uses JSON Web Tokens signed by Flask on successful login. Specific hardening applied:

- **HS256 algorithm explicitly configured** — defends against the classic `"alg": "none"` attack where a forged token claims no signature is needed.
- **Secret key from environment variable**, with a 256-bit random fallback generated via `secrets.token_hex(32)` at startup. Dev environments therefore never use a hardcoded weak default; production environments set `JWT_SECRET_KEY` for a stable key across restarts.
- **Short-lived access tokens (1 hour)** + **long-lived refresh tokens (30 days)** — minimises the window during which a stolen access token is useful, while still letting users stay logged in for weeks.
- **Passwords hashed with bcrypt** before storage — never stored in plaintext, salted automatically so identical passwords yield different hashes.
- **Role-based access control**: admin-only endpoints (`/admin/history`, `/admin/users`, `/admin/users/<id>`) call an `is_admin(user_id)` helper that re-checks the database every request. The `is_admin` claim is never trusted from the token alone, so promoting a user to admin (or demoting one) takes effect immediately without waiting for token expiry.

### 4. Component composition for reusability

The UI is split into small, focused components, each with one responsibility:

- `StatCard` — used on both Dashboard (Total / Learning / Mastered / Progress%) and Admin (Total Users / Total Actions / Unique Words) with different icons, labels, values, and color themes via props
- `ConfirmDialog` — powers both "delete my account" and "delete user" flows, parameterised by title, message, confirm label, and style
- `WordCard` — handles both normal flip-and-master flow *and* select-mode (with checkbox UI) via the same component, controlled by props

Without this composition, the same markup would have been duplicated across pages and would have drifted apart over time. Component composition is the React mental model that pays off most as a project grows.

### 5. Idempotent check-in via SQL UNIQUE constraint

The `check_ins` table has a `UNIQUE (user_id, check_date)` constraint. The `POST /checkin` endpoint catches the `IntegrityError` raised when a user tries to check in twice on the same day, and reports `already_checked_in: true` instead of returning an error.

Pushing "one check-in per day" into the schema means it's enforced even if buggy client code or a future race condition tries to insert a duplicate. The application logic stays simple — no "SELECT first, then INSERT if not exists" race window — and the database guarantees the invariant.

### 6. Cascade delete on user removal

Both `DELETE /account` (self-deletion) and `DELETE /admin/users/<id>` (admin deletion) explicitly delete the user's rows from `vocabulary`, `history`, and `check_ins` before deleting the user record itself.

A user record gone but their words still floating around with a dangling `user_id` would be a data-integrity bug waiting to surface (e.g. another admin sees orphaned words in counts). Explicit cascade in application code, rather than relying on SQLite's foreign-key cascade, keeps the behaviour obvious from reading `app.py`.

### 7. Tailwind v4 + design tokens

Styling uses Tailwind CSS v4 with custom design tokens declared in `index.css` (`--color-primary`, `--color-pink`, etc.). Reusable patterns (`.btn-pop`, `.input-pop`, `.card-pop`) are defined once and applied via class names.

Utility classes co-locate styling with markup. The design-token layer keeps the palette consistent — changing the primary colour is a one-line edit, and every button, badge, and card updates together. This was critical when iterating the palette through several visual themes.

### 8. Framer Motion for orchestrated animation

Page transitions, list staggers, modal pop-in, calendar entrance, mascot float, confetti, and the card-flight-to-wordbook trajectory are all powered by Framer Motion's declarative `motion.*` components.

Raw CSS animations work for simple cases, but Framer Motion handles harder cases cleanly: variable delays per list item, spring physics, exit animations (cards animating *out* when filtered or mastered), keyframe arrays for arc trajectories, and orchestrated sequences. The declarative API keeps animation logic next to the component, instead of scattered across a separate CSS file.

### 9. Mascot image preprocessing (PNG transparency)

The unicorn mascot is a hand-drawn illustration sourced as a JPEG with a faux-checkerboard "transparency" pattern baked in. Three approaches were tried:

1. **CSS `mix-blend-mode: multiply`** — works for white backgrounds but leaves visible artifacts on coloured page backgrounds.
2. **Aggressive pixel-level background removal** — destroys the unicorn's white body and semi-transparent raised arm.
3. **Conservative flood-fill + erosion** *(chosen)* — flood-fills from the four image corners using 8-connectivity, then erodes the result inward by 8 pixels to leave a safety margin around the unicorn's edges. This preserves the body, the half-transparent arm, and the pink cheek blush while removing the bulk of the checkerboard.

The resulting `mascot.png` is a properly transparent PNG that composites cleanly over any background colour. The decision was to move the image-processing complexity out of the runtime UI and into a one-time preprocessing step.

### 10. SQLite for the development database

The backend uses SQLite (`vocab.db`) as a single-file database.

Zero setup. No separate database server to run, no connection strings to manage, no Docker container. For a project that needs to be shareable and runnable on any laptop, this removes a whole class of "doesn't work on my machine" problems. The schema is small enough that migrating to PostgreSQL or MySQL later (for real deployment) is a half-day job — using `flask-sqlalchemy` would abstract away the dialect difference entirely.

---

## What's still planned (out of scope for this submission)

- Quiz mode (multiple choice / spelling)
- Spaced repetition (SM-2 algorithm)
- Stats page with charts (Recharts)
- Dark mode
- Production deployment to Vercel (frontend) + Render or Fly.io (backend)
