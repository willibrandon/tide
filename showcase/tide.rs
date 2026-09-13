//! Readings are immutable; the station owns its history.
#[derive(Debug, Clone)]
struct Reading {
    station: String,
    height: f64,
}

impl Reading {
    fn summarize(&self) -> String {
        format!("{}: {:.2} m", self.station, self.height)
    }
}

fn main() {
    let reading = Reading {
        station: String::from("North Cove"),
        height: 1.72,
    };
    println!("{}", reading.summarize());
}
