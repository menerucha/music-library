import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import MusicLibrary from './MusicLibrary';

// Standalone query client for dev-only App wrapper
const queryClient = new QueryClient();

export default function App() {
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [searchTerm, setSearchTerm] = useState('coldplay');

  return (
    <QueryClientProvider client={queryClient}>
      {/* Dev-only role/search toolbar — not shown in production */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm">
        <span className="font-semibold text-muted-foreground">Standalone dev mode</span>
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            className="border rounded px-1 bg-background"
          >
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Artist or song…"
            className="border rounded px-2 py-0.5 bg-background w-40"
          />
        </label>
      </div>

      {/* The exposed micro-frontend component */}
      <MusicLibrary role={role} searchTerm={searchTerm} />
      <Toaster />
    </QueryClientProvider>
  );
}
