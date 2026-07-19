# Music Library — Micro Frontend Assignment

A Music Library app built as **two fully independent applications** wired together
at runtime with **Vite Module Federation** (`@originjs/vite-plugin-federation`).

```
Music-Library-Assignment/
│
├── music-host/        ← Container / host app (auth, shell, header, routing)
│   ├── package.json    (own deps, own scripts, own lockfile)
│   ├── vite.config.ts  (own build, federation "remotes" config)
│   └── src/
│
├── music-library/      ← Music Library micro frontend (remote)
│   ├── package.json    (own deps, own scripts, own lockfile)
│   ├── vite.config.ts  (own build, federation "exposes" config)
│   └── src/
│
└── README.md            ← you are here
```

`music-host` and `music-library` share **no code, no `node_modules`, no build
output, and no config**. They can live in two separate GitHub repos and two
separate Vercel projects. The only thing that connects them at runtime is a
URL: the host is told (via an env var) where to fetch the library's
`remoteEntry.js` from.

---

## 1. Architecture

```
┌─────────────────────────────┐        HTTP fetch of remoteEntry.js        ┌──────────────────────────────┐
│          music-host          │ ───────────────────────────────────────▶ │         music-library          │
│  (Login, layout, JWT auth,   │        (at runtime, lazy-loaded)          │  (song list, filter/sort/      │
│   role gating, search bar)   │ ◀─────────────────────────────────────── │   group, add/delete, iTunes)   │
└─────────────────────────────┘        exposes ./MusicLibrary component   └──────────────────────────────┘
        deployed on Vercel                                                        deployed on Vercel
        (independent build/URL)                                                   (independent build/URL)
```

- `music-host` is the **Module Federation host**: it never bundles the
  library's code. At runtime it lazy-loads `music_library/MusicLibrary` from
  whatever URL `VITE_REMOTE_URL` points at.
- `music-library` is the **Module Federation remote**: it exposes a single
  component (`./MusicLibrary`) via `remoteEntry.js` and can be built, deployed,
  and versioned completely independently of the host. It also runs standalone
  (`npm run dev` inside `music-library/` shows a small dev harness with a
  role/search toggle) for isolated development.
- `react`, `react-dom`, and `@tanstack/react-query` are declared as
  **shared singletons** in both federation configs so the host and the loaded
  remote share one React instance / one Query cache provider setup instead of
  shipping two copies of React.

---

## 2. Installation & local setup

Each app is installed and run independently.

```bash
# Terminal 1 — the micro frontend (must be running first / on port 5001)
cd music-library
npm install
npm run dev:federated   # builds + serves the REAL remoteEntry.js on :5001

# Terminal 2 — the host (reads music-library's remoteEntry.js from :5001)
cd music-host
npm install
npm run dev              # http://localhost:5000
```

Open **http://localhost:5000** and log in — the host will lazy-load the
library UI from `music-library`'s served build on port 5001.

> ⚠️ **Important:** use `npm run dev:federated` (build + `vite preview`) for
> `music-library` when testing it *through the host*, not plain `npm run dev`.
> `@originjs/vite-plugin-federation` does not serve a real `remoteEntry.js`
> module from Vite's dev server for a *remote* (exposing) app — it falls back
> to serving `index.html`, which the host can't parse as JS, and the library
> silently fails to mount. `npm run dev` is fine for developing the library
> UI in isolation (see below), just not for testing the federation link.

### Running just the micro frontend on its own
`music-library` is a fully working standalone app too:
```bash
cd music-library
npm run dev
```
This shows a small "standalone dev mode" toolbar (role + search fields) so you
can develop/test the library UI without the host at all.

### Environment variables

| App             | Variable          | Purpose                                                                 | Default                  |
|------------------|-------------------|--------------------------------------------------------------------------|---------------------------|
| `music-host`     | `VITE_REMOTE_URL` | Base URL the host fetches `assets/remoteEntry.js` from                   | `http://localhost:5001`  |
| `music-library`  | *(none required)* | Reads live data from the public iTunes Search API, mocks writes with MSW | —                         |

Copy `.env.example` → `.env` in `music-host` if you want to point it at a
deployed library instead of localhost.

---

## 3. Deployment (Vercel)

Deploy the two apps as **two separate Vercel projects**, each rooted at its
own folder.

**music-library first:**
1. Push `music-library/` to its own GitHub repo (or point Vercel's "Root
   Directory" setting at `music-library/` if you keep a monorepo).
2. Import into Vercel → Framework preset "Vite" → deploy.
3. Note the deployed URL, e.g. `https://music-library-xyz.vercel.app`.

**music-host second:**
1. Push `music-host/` to its own GitHub repo (or "Root Directory" = `music-host/`).
2. In Vercel → Project Settings → Environment Variables, set:
   ```
   VITE_REMOTE_URL = https://music-library-xyz.vercel.app
   ```
3. Deploy. The host's build will bake `${VITE_REMOTE_URL}/assets/remoteEntry.js`
   into its federation config, so it loads the library straight from its
   deployed URL — no localhost dependency remains.

Each folder already includes a `vercel.json` with the correct
`buildCommand`, `outputDirectory: dist`, and an SPA rewrite so client-side
routing (`/library`, etc.) works on refresh.

### GitHub setup
Each folder is ready to become its own repo:
```bash
cd music-library && git init && git add . && git commit -m "feat: initial music-library micro frontend" && git remote add origin <repo-url> && git push -u origin main
cd ../music-host    && git init && git add . && git commit -m "feat: initial music-host container app"    && git remote add origin <repo-url> && git push -u origin main
```
Both include a `.gitignore` (node_modules, dist, .env, etc.).

---

## 4. Demo credentials

| Role  | Username | Password    | Can do                                   |
|-------|----------|-------------|-------------------------------------------|
| Admin | `admin`  | `password123` | View, filter, sort, group, **add**, **delete** |
| User  | `user`   | `password123` | View, filter, sort, group only            |

Credentials are also shown as tappable "Quick Access Demo" buttons on the
login screen.

---

## 5. How authentication & role-based access work

- On login, `music-host` checks the username/password against an in-memory
  demo user list and issues a **mock JWT** (`src/utils/jwt.ts`): a real
  `header.payload.signature` base64url-encoded structure with `sub`, `role`,
  `iat`, and `exp` claims — just signed with a hardcoded demo secret instead of
  a real backend, per the assignment's "no backend required" note.
- The token is kept in React Context (`AuthContext`) and mirrored into
  `localStorage` so a refresh doesn't log you out (until the 24h `exp` passes).
- `music-host` passes the decoded `role` down as a **prop** to the federated
  `<MusicLibrary role={...} />` component. The remote has no auth logic of its
  own — it just renders/hides the "Add to Crate" button and delete controls
  based on the `role` prop it's given (`admin` → sees them, `user` → doesn't).

---

## 6. How Module Federation works here

- `music-library`'s `vite.config.ts` uses `@originjs/vite-plugin-federation`
  to **expose** `./MusicLibrary` → `src/MusicLibrary.tsx`, emitted as
  `remoteEntry.js` in its build output.
- `music-host`'s `vite.config.ts` declares a **remote** named `music_library`
  pointing at `${VITE_REMOTE_URL}/assets/remoteEntry.js`.
- In `music-host/src/pages/Library.tsx`, the component is **lazy-loaded**:
  ```ts
  const MusicLibrary = lazy(() => import('music_library/MusicLibrary'));
  ```
  wrapped in `<Suspense>` with a loading fallback — this import is resolved
  at runtime against whatever URL the remote points at, not bundled at build
  time. That's what makes the two apps independently deployable: you can
  redeploy `music-library` at any time and `music-host` will pick up the new
  version on next page load, without a host rebuild.

---

## 7. How React Query is used

- Reads: `useSongsQuery(searchTerm)` (in `music-library/src/hooks/`) wraps
  `useQuery` — components never call `useQuery` directly. It fetches from the
  **iTunes Search API** in parallel with the mocked local `/songs` endpoint
  and merges the results, giving real loading/error/cache/refetch behavior.
- Writes: `useAddSong()` / `useDeleteSong()` wrap `useMutation`, POST/DELETE
  against a mocked backend (**MSW**, `src/mocks/handlers.ts`), and
  **invalidate the `['songs']` query on success** so the list updates without
  a full page refresh. Cache invalidation was chosen over optimistic updates
  for simplicity and because the mocked endpoint responds fast enough that the
  UX difference is negligible — see tradeoffs below.

---

## 8. Tradeoffs & future improvements

**Tradeoffs made:**
- Chose **cache invalidation** over optimistic updates for add/delete —
  simpler to reason about and test, at the cost of a brief (sub-100ms)
  loading flicker on mutation instead of an instant UI update.
- Used **MSW** for the mocked write backend so the whole app (host + library)
  deploys as static files with nothing extra to host, rather than standing up
  a real Express/json-server backend.
- The mock JWT is **not cryptographically verified** anywhere (no backend to
  verify it) — acceptable for this assignment's scope, but not something to
  ship to production as-is.
- `react`, `react-dom`, and `@tanstack/react-query` are shared singletons
  across the federation boundary; every other dependency (Radix UI, Tailwind,
  etc.) is duplicated in both bundles, which is simple but means slightly
  larger downloads than a fully deduped setup.

**With more time, I'd:**
- Add a lightweight E2E test (Playwright) exercising the host+library
  integration, login, add/delete, and role gating end-to-end.
- Swap the mock JWT for a real signed token from a tiny serverless function,
  still without a full backend.
- Add optimistic updates for delete (instant removal, roll back on failure)
  since it's the mutation most likely to feel slow otherwise.
- Version the federation contract (e.g. expose a `MusicLibrary@1`) so host and
  remote can evolve independently without silently breaking each other.

---

## 9. Feature checklist (verified against the assignment PDF)

| Requirement | Status |
|---|---|
| Song list, clean UI | ✅ |
| Filter / sort / group by Album, Artist, Title | ✅ (via `map`/`filter`/`reduce`/`sort`, no library) |
| Reads via iTunes Search API through `useSongsQuery()` (wraps `useQuery`) | ✅ |
| iTunes fields mapped to UI model (`trackName`→`title`, etc.) | ✅ |
| Real loading & error states | ✅ |
| Micro frontend split: host + remote via Module Federation | ✅ |
| Lazy loading of the remote | ✅ |
| Add Song form with `react-hook-form` + validation (required, year numeric) | ✅ (zod + `@hookform/resolvers`) |
| Submit via `useMutation` → mocked `POST /songs`, cache invalidation | ✅ |
| Delete song (admin only), invalidates cache | ✅ |
| Mock JWT auth, roles admin/user | ✅ |
| Role-based UI gating (add/delete vs view-only) | ✅ |
| Independent builds, independent deploys | ✅ (verified: both `npm run build` cleanly on their own) |
| No `localhost` baked into production build | ✅ (`VITE_REMOTE_URL` env var) |
| Conventional Commits | ⚠ Set up your own commit history when you push — see §3 |
