import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Song, SongInput } from '../types/song';
import { SONGS_QUERY_KEY } from './useSongsQuery';

async function addSong(input: SongInput): Promise<Song> {
  const res = await fetch('/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Failed to add song');
  }
  return res.json();
}

// Wraps useMutation — components must never call useMutation directly.
export function useAddSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSong,
    // Cache-invalidation strategy: after a successful add, refetch all songs
    // queries so the new song immediately appears in the list.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
    },
  });
}
