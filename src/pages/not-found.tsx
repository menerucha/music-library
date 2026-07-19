import { Disc3 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <Disc3 className="w-12 h-12 text-primary/60 mx-auto mb-6 animate-[spin_6s_linear_infinite]" />
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-3">Side not found</h1>
        <p className="text-muted-foreground text-sm">
          Did you forget to add the page to the router?
        </p>
      </div>
    </div>
  );
}
