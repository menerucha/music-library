interface VinylGrooveProps {
  className?: string;
}

/**
 * Signature decorative element — concentric "vinyl groove rings",
 * used sparingly behind hero/header panels. Literal to the subject
 * (a record collection) without being a literal record illustration.
 */
export function VinylGroove({ className = '' }: VinylGrooveProps) {
  const rings = [180, 156, 132, 110, 90, 72, 56, 42, 30, 20];
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          stroke="currentColor"
          strokeWidth={i === rings.length - 1 ? 3 : 1}
          opacity={i === rings.length - 1 ? 0.5 : 0.14}
        />
      ))}
    </svg>
  );
}
