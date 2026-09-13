// Package main presents a small coastal observation.
package main

import "fmt"

type Reading struct {
    Station string
    Height  float64
}

func (r Reading) Summarize() string {
    return fmt.Sprintf("%s: %.2f m", r.Station, r.Height)
}

func main() {
    reading := Reading{Station: "North Cove", Height: 1.72}
    fmt.Println(reading.Summarize())
}
