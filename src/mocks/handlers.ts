import { http, HttpResponse } from 'msw';
import type { Song, SongInput } from '../types/song';

// In-memory store shared across all handlers in this worker instance
const localSongs: Song[] = [];
let nextId = 1;

export const handlers = [
  // GET /songs — return all locally-added songs
  http.get('/songs', () => {
    return HttpResponse.json([...localSongs]);
  }),

  // POST /songs — add a new song
  http.post('/songs', async ({ request }) => {
    const data = (await request.json()) as SongInput;

    if (!data.title || !data.artist || !data.album || !data.year) {
      return HttpResponse.json(
        { error: 'title, artist, album, and year are required' },
        { status: 400 },
      );
    }

    const song: Song = {
      id: `local-${nextId++}`,
      title: data.title,
      artist: data.artist,
      album: data.album,
      year: Number(data.year),
      genre: data.genre ?? 'Unknown',
      artworkUrl: '',
      source: 'local',
    };

    localSongs.push(song);
    return HttpResponse.json(song, { status: 201 });
  }),

  // DELETE /songs/:id — remove a locally-added song
  http.delete('/songs/:id', ({ params }) => {
    const id = params.id as string;
    const idx = localSongs.findIndex((s) => s.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    const [deleted] = localSongs.splice(idx, 1);
    return HttpResponse.json(deleted);
  }),
];
