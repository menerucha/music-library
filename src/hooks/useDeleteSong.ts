import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SONGS_QUERY_KEY } from './useSongsQuery';

async function deleteSong(id: string): Promise<void> {
  const res = await fetch(`/songs/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Failed to delete song');
  }
}

// Wraps useMutation — components must never call useMutation directly.
export function useDeleteSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSong,
    // Cache-invalidation: after delete, refetch so the song disappears immediately.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
    },
  });
}
