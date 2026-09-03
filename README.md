# Storm Islands Time Calculator

A static browser calculator for tracking occupied islands in Goodgame Empire's Storm Islands event.

## What it calculates

- The input time is the moment a player successfully occupies the island.
- Disappearance is calculated from occupation time plus the manually entered active duration.
- Small Islands allow up to 6 hours and respawn 1 day after disappearing.
- Large Islands allow up to 16 hours and respawn 3 days after disappearing.
- Respawn coordinates use the island coordinates entered in the tracker.
- The live clock on every tracked island counts down to disappearance, then continues to respawn.
- The direction arrow shows the bearing from the player's position to the island, from 0 to 360 degrees.
- Distance is calculated from both coordinate pairs and displayed as an approximate value with `~`.

## Run

Open `index.html` directly in a browser. No server or dependency installation is required. All results remain in the current browser tab.

Distance uses Euclidean coordinate distance. For example, player `707:598` and island `719:593` are approximately `~13` coordinates apart.
