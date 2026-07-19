// Raw shape from iTunes Search API
export interface iTunesSong {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  releaseDate: string;
  artworkUrl100: string;
  primaryGenreName: string;
  trackTimeMillis: number;
  previewUrl?: string;
  kind: string;
}

// Normalised shape used throughout the app
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  artworkUrl: string;
  previewUrl?: string;
  durationMs?: number;
  /** 'itunes' = read-only; 'local' = can be deleted */
  source: 'itunes' | 'local';
}

// Shape for the add-song form / POST body
export interface SongInput {
  title: string;
  artist: string;
  album: string;
  year: number;
  genre?: string;
}

// Maps an iTunes track to our normalised Song
export function mapItunesSong(track: iTunesSong): Song {
  return {
    id: `itunes-${track.trackId}`,
    title: track.trackName ?? 'Unknown Title',
    artist: track.artistName ?? 'Unknown Artist',
    album: track.collectionName ?? 'Unknown Album',
    year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : 0,
    genre: track.primaryGenreName ?? 'Unknown',
    artworkUrl: track.artworkUrl100 ?? '',
    previewUrl: track.previewUrl,
    durationMs: track.trackTimeMillis,
    source: 'itunes',
  };
}
