export interface Observation {
  readonly station: string;
  readonly height: number;
  readonly measuredAt?: Date;
}

export function describe(reading: Observation): string {
  const height = reading.height.toFixed(2);
  return `${reading.station}: ${height} m`;
}

export function isHighTide(height: number, threshold = 2.4): boolean {
  return height >= threshold;
}
