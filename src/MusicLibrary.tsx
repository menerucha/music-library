import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSongsQuery } from './hooks/useSongsQuery';
import { useAddSong } from './hooks/useAddSong';
import { useDeleteSong } from './hooks/useDeleteSong';
import type { Song, SongInput } from './types/song';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, RotateCw, Music2, Disc3, SortAsc, SortDesc, Library, Plus, Minus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SongCard } from './components/SongCard';
import { AddSongForm } from './components/AddSongForm';
import { VinylGroove } from './components/VinylGroove';

export interface MusicLibraryProps {
  role: 'admin' | 'user';
  searchTerm?: string;
  onAuthRequired?: () => void;
}

type SortField = 'title' | 'artist' | 'album' | 'year';
type SortDir = 'asc' | 'desc';
type GroupBy = 'none' | 'artist' | 'album' | 'title';

const addSongSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  album: z.string().min(1, 'Album is required'),
  year: z.coerce
    .number({ invalid_type_error: 'Year must be a number' })
    .int()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  genre: z.string().optional(),
});

type AddSongFormData = z.infer<typeof addSongSchema>;

// ---- Internal query client (self-contained when used as a micro frontend) ----
const mfeQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

// ---- The inner component (outside the provider so hooks work) ----
function MusicLibraryInner({ role, searchTerm = 'coldplay', onAuthRequired }: MusicLibraryProps) {
  // ─── UI state ───────────────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showAddForm, setShowAddForm] = useState(false);

  // ─── Data hooks ─────────────────────────────────────────────────────────────
  const { data: allSongs = [], isLoading, isError, error, refetch } = useSongsQuery(searchTerm);
  const addSong = useAddSong();
  const deleteSong = useDeleteSong();

  // ─── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<AddSongFormData>({
    resolver: zodResolver(addSongSchema),
    defaultValues: { title: '', artist: '', album: '', year: new Date().getFullYear(), genre: '' },
  });

  const handleAddSubmit = (data: AddSongFormData) => {
    const input: SongInput = { ...data, genre: data.genre || undefined };
    addSong.mutate(input, {
      onSuccess: () => {
        form.reset();
        setShowAddForm(false);
      },
    });
  };

  // ─── Client-side filter → sort → group (using only built-in JS methods) ─────

  // 1. filter — Array.prototype.filter
  const filtered = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    if (!q) return allSongs;
    return allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q),
    );
  }, [allSongs, filterText]);

  // 2. sort — Array.prototype.sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = sortField === 'year' ? a[sortField] : a[sortField].toLowerCase();
      const bVal = sortField === 'year' ? b[sortField] : b[sortField].toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  // 3. group — Array.prototype.reduce
  const grouped = useMemo(() => {
    if (groupBy === 'none') return { All: sorted };
    return sorted.reduce<Record<string, Song[]>>((acc, song) => {
      const key = groupBy === 'artist' ? song.artist : groupBy === 'album' ? song.album : song.title;
      if (!acc[key]) acc[key] = [];
      acc[key].push(song);
      return acc;
    }, {});
  }, [sorted, groupBy]);

  const groups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div data-testid="songs-loading" className="min-h-screen bg-background p-6 md:p-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4 text-primary opacity-80">
            <Disc3 className="w-8 h-8 animate-[spin_3s_linear_infinite]" />
            <h1 className="font-serif text-3xl font-semibold">Dusting off the crates...</h1>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 opacity-50">
            <div className="h-10 bg-muted rounded-lg flex-1 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-4 border border-border rounded-lg bg-card/20 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-md shrink-0" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="songs-error" className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md bg-card p-8 rounded-xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
            <Disc3 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">The needle skipped</h2>
          <p className="text-muted-foreground">{String(error)}</p>
          <div className="pt-4">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold tracking-wide rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              <RotateCw className="w-4 h-4" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="music-library" className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 overflow-hidden">
          <VinylGroove className="absolute -right-10 -top-16 w-56 h-56 text-primary/[0.08] pointer-events-none hidden md:block" />
          <div className="relative">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Library className="w-9 h-9" />
              <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                Record Crate
              </h1>
            </div>
            <p className="font-mono text-xs uppercase tracking-catalog text-muted-foreground mt-3">
              Search the archives · add rarities · organize by release
            </p>
          </div>
          
          {role === 'admin' && (
            <button
              data-testid="button-add-song"
              onClick={() => setShowAddForm((v) => !v)}
              className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold tracking-wide rounded-full hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 group whitespace-nowrap shrink-0"
            >
              {showAddForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />}
              {showAddForm ? 'Close Crate' : 'Add to Crate'}
            </button>
          )}
        </header>

        {/* Add Song Form */}
        <AnimatePresence>
          {role === 'admin' && showAddForm && (
            <AddSongForm
              form={form}
              onSubmit={handleAddSubmit}
              isPending={addSong.isPending}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 sticky top-4 z-10">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              data-testid="input-filter"
              type="search"
              placeholder="Search title, artist, album..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm font-medium transition-all placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar shrink-0">
            {/* Sort Field */}
            <div className="relative shrink-0">
              <select
                data-testid="select-sort-field"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-background border border-border/50 rounded-lg text-sm font-bold tracking-tight focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-muted/50"
              >
                <option value="title">Sort by Title</option>
                <option value="artist">Sort by Artist</option>
                <option value="album">Sort by Album</option>
                <option value="year">Sort by Year</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Sort Dir */}
            <button
              data-testid="select-sort-dir"
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="shrink-0 p-2.5 bg-background border border-border/50 rounded-lg hover:bg-muted focus:ring-1 focus:ring-primary transition-all text-foreground"
              title={sortDir === 'asc' ? "Ascending" : "Descending"}
            >
              {sortDir === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>

            {/* Group By */}
            <div className="relative shrink-0">
              <select
                data-testid="select-group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-background border border-border/50 rounded-lg text-sm font-bold tracking-tight focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-muted/50"
              >
                <option value="none">No Grouping</option>
                <option value="artist">Group by Artist</option>
                <option value="album">Group by Album</option>
                <option value="title">Group by Title</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {sorted.length === 0 ? (
          <div data-testid="songs-empty" className="text-center py-24 px-4 bg-card rounded-xl border border-dashed border-border">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
              <Music2 className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-serif text-2xl font-semibold mb-2">Crate is empty</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any tracks matching your search. Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map(([groupName, songs]) => (
              <div key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                {groupBy !== 'none' && (
                  <div className="flex items-baseline gap-4 mb-4 pb-2 border-b-2 border-primary/10">
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{groupName}</h2>
                    <span className="font-mono text-[11px] font-medium uppercase tracking-catalog text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">{songs.length} track{songs.length === 1 ? '' : 's'}</span>
                  </div>
                )}
                
                <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden divide-y divide-border">
                  <AnimatePresence initial={false} mode="popLayout">
                    {songs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        role={role}
                        onDelete={(id) => deleteSong.mutate(id)}
                        isDeleting={deleteSong.isPending && (deleteSong.variables as any) === song.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Public export — wraps itself in its own QueryClientProvider ----
// so it works both standalone and when loaded as a micro frontend.
export default function MusicLibrary(props: MusicLibraryProps) {
  return (
    <QueryClientProvider client={mfeQueryClient}>
      <MusicLibraryInner {...props} />
    </QueryClientProvider>
  );
}