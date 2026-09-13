/** JSX fixture with no external dependency. */
declare namespace JSX {
  interface IntrinsicElements {
    section: { children?: unknown; 'aria-label'?: string };
    h2: { children?: unknown };
    p: { children?: unknown };
  }
}

export function StationCard({ name, height }: { name: string; height: number }) {
  return (
    <section aria-label="Tide reading">
      <h2>{name}</h2>
      <p>{height.toFixed(2)} m</p>
    </section>
  );
}
