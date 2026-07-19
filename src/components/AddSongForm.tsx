import { UseFormReturn } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import type { SongInput } from '../types/song';

interface AddSongFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function AddSongForm({ form, onSubmit, isPending, onCancel }: AddSongFormProps) {
  const { register, formState: { errors } } = form;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <form
        data-testid="form-add-song"
        onSubmit={form.handleSubmit(onSubmit)}
        className="mb-8 p-6 bg-card border-2 border-primary/20 shadow-sm rounded-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl font-semibold text-primary">Add to Collection</h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground">Title *</label>
            <input
              data-testid="input-song-title"
              {...register('title')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. Yellow"
            />
            {errors.title && <p className="text-destructive text-xs font-medium">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground">Artist *</label>
            <input
              data-testid="input-song-artist"
              {...register('artist')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. Coldplay"
            />
            {errors.artist && <p className="text-destructive text-xs font-medium">{errors.artist.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground">Album *</label>
            <input
              data-testid="input-song-album"
              {...register('album')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. Parachutes"
            />
            {errors.album && <p className="text-destructive text-xs font-medium">{errors.album.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground">Year *</label>
              <input
                data-testid="input-song-year"
                type="number"
                {...register('year')}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.year && <p className="text-destructive text-xs font-medium">{errors.year.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground">Genre</label>
              <input
                data-testid="input-song-genre"
                {...register('genre')}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. Alternative"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            data-testid="button-submit-song"
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold tracking-wide rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm shadow-primary/20"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isPending ? 'Adding...' : 'Add to Crate'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
