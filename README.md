# music-library

The Module Federation **remote** micro frontend for the Music Library project.
Exposes a single `./MusicLibrary` component, consumed by `music-host` at
runtime via `remoteEntry.js`. Runs standalone too, for isolated development.

Quick start:
```bash
npm install
npm run dev   # http://localhost:5001
```

Reads songs from the public iTunes Search API via a `useSongsQuery()` hook
(wrapping React Query), and mocks `POST /songs` / `DELETE /songs/:id` with
MSW so adds/deletes are real async calls, not local state mutations.

Full project docs, architecture, deployment steps, and credentials live in
the top-level `README.md` at the repo root (`../README.md`), or see the
"Music Library" project README if you're viewing this repo standalone.
