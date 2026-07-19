import { useQuery } from '@tanstack/react-query';
import type { Song, iTunesSong } from '../types/song';
import { mapItunesSong } from '../types/song';

export const SONGS_QUERY_KEY = ['songs'] as const;

// ----- iTunes fetch -----
async function fetchItunesSongs(searchTerm: string): Promise<Song[]> {
  const term = searchTerm.trim() || 'coldplay';
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const json = await res.json();

  // Use map() to transform iTunes fields into our normalised Song shape
  return (json.results as iTunesSong[])
    .filter((t) => t.kind === 'song')
    .map(mapItunesSong);
}

// ----- Local (MSW-mocked) fetch -----
async function fetchLocalSongs(): Promise<Song[]> {
  const res = await fetch('/songs');
  if (!res.ok) return [];
  return res.json();
}

// ----- Public hook -----
// Wraps useQuery — components must never call useQuery directly.
export function useSongsQuery(searchTerm = 'coldplay') {
  return useQuery({
    queryKey: [...SONGS_QUERY_KEY, searchTerm] as const,
    queryFn: async () => {
      // Fetch both sources in parallel, then merge with locals first
      const [localSongs, itunesSongs] = await Promise.all([
        fetchLocalSongs(),
        fetchItunesSongs(searchTerm),
      ]);

      // Merge: local songs appear first so they're visible without scrolling
      return [...localSongs, ...itunesSongs];
    },
    staleTime: 1000 * 60 * 5, // 5 min — cache iTunes results
    retry: 2,
  });
}
