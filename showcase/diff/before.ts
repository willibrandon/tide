export interface Observation {
  station: string;
  height: number;
}

export function describe(reading: Observation): string {
  return `${reading.station}: ${reading.height} m`;
}

export function isHighTide(height: number): boolean {
  return height > 2;
}
