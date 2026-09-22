## Live Demo Walkthrough

1. Log in as **Lani** (borrower) and **Arun Kumar** (owner) in two browser tabs.
2. **Discover** — search "calculator"; Arun's *Scientific Calculator* is `AVAILABLE`.
3. **Lani requests it** with a reason + duration → request is `PENDING`.
4. **Arun** opens **My Requests** → sees Lani → **Accept** → item becomes `RESERVED` and
   vanishes from Discover (no double-booking).
5. **Arun** generates the **handover QR + 6-digit code** for that request.
6. **Lani** opens **My Borrowings** → **Handover** → verifies by **scanning the QR** (or
   typing the code) → item becomes `BORROWED` and a Transaction is created.
7. **Lani** requests a return → status `RETURN_REQUESTED`.
8. **Arun** sees it in **My Lending** → **Confirm Return** → item is `AVAILABLE` again.
9. Both leave **5-star reviews** → **Reputation** shows updated ratings + trust scores.
10. Notifications appear **live** (Socket.IO) and in the notification feed.
11. Optional: log in as **Admin** → platform stats, users, transactions, moderation.

Automated proof of the same flow:

```powershell
powershell -ExecutionPolicy Bypass -File backend/workflow-test.ps1
```

## Exchange Lifecycle

```
Borrower             Owner                  Item status
--------             -----                  -----------
request ──────────►  sees request           AVAILABLE
         ◄─────────  accepts                RESERVED (others auto-declined)
                     generates QR/code
scan QR / enter code
═══ handover verified ═══════════════════►  BORROWED (Transaction created)
request return ──►   confirms return        AVAILABLE
both review → trust/rating updated
```

## Scanning QRs on a real phone (LAN testing)

Handover QRs encode a **reachable URL** (`{PUBLIC_APP_URL}/handover/{token}`), so a phone on
the same Wi-Fi opens a proper handover page — never `localhost`.

1. **Find your computer's LAN IP** (the one from Wi-Fi, not 127.0.0.1):
   ```powershell
   ipconfig
   # e.g. IPv4 Address . . . : 192.168.1.6
   ```
2. **Point the app URL at it** in BOTH env files:
   - `backend/.env` → `PUBLIC_APP_URL=http://192.168.1.6:5173`
   - `frontend/.env` → `VITE_APP_URL=http://192.168.1.6:5173` (must match)
3. **Restart both servers** (`npm run dev:backend`, `npm run dev:frontend`). Vite already
   listens on `0.0.0.0` (`host: true`), so it is reachable over the LAN.
4. **Same network + firewall**: your phone must be on the same Wi-Fi, and the OS firewall
   must allow Node on ports `5000`/`5173`. Sanity check from the phone's browser:
   `http://192.168.1.6:5173` should load BorrowBox.
5. **Try the flow**: owner generates the QR → borrower scans it with the phone camera →
   phone opens the `/handover/:token` page → sign in (if needed) → **Confirm handover**.
   The token is single-use and expires after `HANDOVER_TTL` (default `15m`).

The `/api` and `/uploads` calls from the phone go through the Vite proxy, so no CORS setup
is needed for LAN testing. In production, set `PUBLIC_APP_URL` to the HTTPS domain and
CORS accepts the configured origins automatically.

## API Overview

All endpoints require a JWT unless marked `public` or `admin`.

| Method | Endpoint                                                     | Description                          |
| ------ | ------------------------------------------------------------ | ------------------------------------ |
| POST   | `/api/auth/register`                     `public`            | Create an account                    |
| POST   | `/api/auth/login`                        `public`            | Sign in → JWT + public profile       |
| PUT    | `/api/auth/profile`                                          | Update name/dept/year/photo (multipart) |
| PUT    | `/api/auth/password`                                         | Change password                      |
| GET    | `/api/items`                                 `public`        | Discover: search/filter/sort/paginate |
| GET    | `/api/items/:id`                         `public`            | Item detail                          |
| POST   | `/api/items`                                                 | Create item (multipart images)       |
| PUT    | `/api/items/:id`                                             | Update item (owner)                  |
| PUT    | `/api/items/:id/availability`                                | Toggle availability (owner)          |
| DELETE | `/api/items/:id`                                             | Delete item (owner/admin)            |
| POST   | `/api/borrow-requests`                                       | Send a borrow request                |
| GET    | `/api/borrow-requests/my`                                    | Requests I sent                      |
| GET    | `/api/borrow-requests/received`                              | Requests I received                  |
| PUT    | `/api/borrow-requests/:id/accept`                            | Accept (owner)                       |
| PUT    | `/api/borrow-requests/:id/decline`                           | Decline (owner)                      |
| POST   | `/api/transactions/handover/:requestId/generate`             | Create QR + code (QR encodes a phone-reachable URL) |
| POST   | `/api/transactions/handover/:requestId/verify`               | Verify handover (QR/code)            |
| POST   | `/api/transactions/handover/verify`                          | Verify by token alone (used by the `/handover/:token` page) |
| GET    | `/api/transactions/handover/info/:token`        `public`     | Public info for a handover link      |
| GET    | `/api/transactions/my`                                       | My borrowing transactions            |
| GET    | `/api/transactions/owned`                                    | Transactions on my items             |
| POST   | `/api/transactions/:id/request-return`                       | Borrower requests return             |
| PUT    | `/api/transactions/:id/confirm-return`                       | Owner confirms return                |
| GET    | `/api/notifications`                                         | My notifications + unread count      |
| PUT    | `/api/notifications/read-all`                                | Mark all read                        |
| POST   | `/api/reviews`                                               | Review a completed exchange          |
| GET    | `/api/reviews/mine`                                          | Reviews I wrote                      |
| GET    | `/api/users/:id/reputation`                  `public`        | Rating / trust / review history      |
| GET    | `/api/dashboard`                                             | Personalized home statistics         |
| POST   | `/api/reports`                                               | Report an item or user               |
| GET/PUT/DELETE | `/api/admin/*`                                       `admin` | Stats, users, items, transactions, reports |

## Database Collections

- **User** — email, name, department, year, `role` (student/admin), photo, `trustScore`,
  `rating`/`ratingCount`.
- **Item** — owner, name, description, category, condition, images, location,
  `availability`, `status` (AVAILABLE/RESERVED/BORROWED/UNAVAILABLE). Full-text index on
  name + description.
- **BorrowRequest** — item, borrower, owner, reason, duration, status
  (PENDING/ACCEPTED/DECLINED/BORROWED/RETURN_REQUESTED/RETURNED), handover-code hash,
  timestamps.
- **Transaction** — item, request, owner, borrower, status
  (BORROWED/RETURN_REQUESTED/RETURNED), borrowed/expected/returned dates.
- **Notification** — user, type, message, link, `read`.
- **Review** — transaction, reviewer, reviewed user, rating (1–5), comment; unique per
  (transaction, reviewer).
- **Report** — reporter, target type (item/user), target id, reason, status
  (OPEN/RESOLVED).

## Security Notes

- Passwords hashed with **bcrypt**; JWT auth on `Authorization: Bearer <token>`.
- Handover codes are stored **hashed** (SHA-256); the QR/GUID token is signed JWT with a
  short expiry (`HANDOVER_TTL`, default 15m) and is **single-use**.
- Owner-only and admin-only middleware guard mutating routes.
- File uploads validated by type/size and served from an isolated `/uploads` directory.