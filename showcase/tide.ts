/** Small, explicit building blocks. A quieter place to think. */
export interface Reading {
  readonly station: string;
  readonly height: number;
  readonly measuredAt: Date;
}

export type Phase = 'rising' | 'falling' | 'slack';

export class TideStation {
  private readonly readings: Reading[] = [];

  constructor(public readonly name: string) {}

  record(height: number, measuredAt = new Date()): Reading {
    const reading: Reading = { station: this.name, height, measuredAt };
    this.readings.push(reading);
    return reading;
  }

  get phase(): Phase {
    const [previous, latest] = this.readings.slice(-2);
    if (!previous || !latest) return 'slack';
    const delta = latest.height - previous.height;
    return Math.abs(delta) < 0.05 ? 'slack' : delta > 0 ? 'rising' : 'falling';
  }

  summarize(): string {
    const latest = this.readings.at(-1);
    return latest
      ? `${this.name}: ${latest.height.toFixed(2)} m · ${this.phase}`
      : `${this.name}: awaiting a reading`;
  }
}

const station = new TideStation('North Cove');
station.record(1.25);
station.record(1.72);
console.log(station.summarize());
