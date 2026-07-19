import { useState, useRef } from 'react';
import { Play, Pause, Trash2, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Song } from '../types/song';

interface SongCardProps {
  song: Song;
  role: 'admin' | 'user';
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function SongCard({ song, role, onDelete, isDeleting }: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pause all other audio on the page
      document.querySelectorAll('audio').forEach((a) => {
        if (a !== audioRef.current) {
          a.pause();
          a.currentTime = 0;
        }
      });
      audioRef.current.play();
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden', padding: 0, border: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors"
      data-testid={`card-song-${song.id}`}
    >
      <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted shadow-sm flex items-center justify-center">
        {song.artworkUrl ? (
          <img src={song.artworkUrl} alt={song.album} className="h-full w-full object-cover" />
        ) : (
          <Music className="w-8 h-8 text-muted-foreground/30" />
        )}
        
        {song.previewUrl && (
          <>
            <audio
              ref={audioRef}
              src={song.previewUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg shadow-primary/30">
                {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4" fill="currentColor" />}
              </div>
            </button>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-serif text-lg font-medium truncate leading-tight text-foreground" data-testid={`text-title-${song.id}`}>
          {song.title}
        </h3>
        <p className="text-sm text-foreground/80 truncate font-medium mt-1">
          {song.artist}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {song.album}
        </p>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 gap-2">
        <div className="flex gap-2">
          {song.year > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium tracking-catalog bg-secondary text-secondary-foreground">
              {song.year}
            </span>
          )}
          {song.genre && (
            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium tracking-catalog border border-border text-muted-foreground">
              {song.genre.toUpperCase()}
            </span>
          )}
        </div>
        
        {role === 'admin' && song.source === 'local' && onDelete && (
          <button
            onClick={() => onDelete(song.id)}
            disabled={isDeleting}
            data-testid={`button-delete-${song.id}`}
            className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors mt-1"
            title="Delete from collection"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Delete</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
