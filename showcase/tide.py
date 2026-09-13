"""A tide table, with a small and predictable interface."""
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class Reading:
    station: str
    height: float
    measured_at: datetime


def summarize(readings: list[Reading]) -> str:
    if not readings:
        return "Awaiting a reading"
    latest = max(readings, key=lambda item: item.measured_at)
    return f"{latest.station}: {latest.height:.2f} m"


sample = Reading("North Cove", 1.72, datetime.now(timezone.utc))
print(summarize([sample]))
