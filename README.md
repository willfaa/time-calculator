# Storm Islands Time Calculator

A static browser calculator for tracking occupied islands in Goodgame Empire's Storm Islands event.

## What it calculates

- The input time is the moment a player successfully occupies the island.
- Disappearance is calculated from occupation time plus the manually entered active duration.
- Small Islands allow up to 6 hours and respawn 1 day after disappearing.
- Large Islands allow up to 16 hours and respawn 3 days after disappearing.
- Respawn coordinates are randomized inside the X/Y offset ranges you enter.
- Attack timing can use a manual travel duration or a simple coordinate distance divided by speed.
- The send time is calculated so the attack arrives at disappearance or the next respawn.

## Run

Open `index.html` directly in a browser. No server or dependency installation is required. All results remain in the current browser tab.

The distance mode uses Euclidean coordinate distance and is intended as an estimate. Use manual travel duration when the game's server movement rules differ.
