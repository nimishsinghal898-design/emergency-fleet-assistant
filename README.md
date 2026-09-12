# Emergency Fleet Command System

## Project Overview
The Emergency Fleet Command System is an advanced, algorithm-driven operational dashboard and simulation backend for optimizing emergency vehicle dispatch. 

## Problem Statement
Urban emergency dispatch systems face a critical balancing act: allocating limited emergency vehicles to immediate incidents while simultaneously preserving spatial coverage for unknown future emergencies. Naive nearest-idle dispatching often leaves large geographical zones unprotected, leading to disastrous response times for subsequent critical incidents.

## Architecture
The system employs a strict client-server architecture:
- **Simulation Engine & Backend API**: A deterministic simulation engine that enforces strict causality. It manages the mathematical state of the grid, vehicles, and incidents.
- **Frontend Dashboard**: A professional operations center interface that provides live visualization of the simulated timeline, metrics comparison, and coverage evaluation.

## Technology Stack
- **Backend**: Python 3.13, FastAPI, Pydantic, NumPy (for PCG64 random generation).
- **Frontend**: React, Vite, Tailwind CSS, TypeScript.
- **Testing**: Pytest, strictly typed and highly isolated unit/integration tests.
- **Containerization**: Docker multi-stage build.

## Setup Instructions (One-Command Execution)
Run the entire application (backend and frontend) with a single command:
```bash
docker build -t emergency-fleet .
docker run -p 8000:8000 emergency-fleet
```
Then visit `http://localhost:8000` in your browser.
*(For a native/local setup, see QUICKSTART.md)*

## Simulation Rules
1. Grid is a 100x100 Euclidean space.
2. Vehicles travel at 1 unit per minute.
3. Incidents arrive dynamically at integer minutes.
4. Each incident has a priority: Priority 1 (highest), 2, or 3 (lowest).
5. All assignments carry an exact 8-minute on-scene completion penalty after arrival.

## Dispatcher Methodology
The **Coverage-Aware Dispatcher** evaluates a complex cost function for every idle vehicle against waiting incidents. It strictly balances:
1. Distance (Euclidean travel time).
2. Priority Urgency (scaling penalties for P1 vs P3).
3. Coverage Preservation (preventing total quadrant depletion).
4. Vehicle Scarcity (protecting lightly populated quadrants).

## Coverage Preservation Strategy
The map is conceptually split into four 50x50 quadrants. The dispatcher dynamically looks ahead at the *result* of a potential assignment. If assigning a specific vehicle would drop its quadrant's idle vehicle count to 0, an extreme mathematical penalty is applied to that decision score, naturally shifting the dispatcher to select a slightly further vehicle from a heavily populated quadrant, unless the incident is an absolute critical Priority 1 emergency that overrides the penalty.

## Metrics
- **Response Performance**: Priority-weighted average response time (lower is better).
- **Priority-3 Response**: Specific tracking of non-critical response lag.
- **Coverage Outage**: Total minutes where *any* quadrant had 0 idle vehicles available.
- **Assignment Queue**: Total fulfilled incidents.

## API Overview
- `POST /api/simulations`: Triggers a new simulation run.
- `GET /api/simulations/{run_id}`: Retrieves comprehensive run state and metrics.
- `GET /api/simulations/{run_id}/export/json`: Downloads raw JSON output.
- `GET /api/simulations/{run_id}/export/csv`: Downloads raw CSV summaries.

## Testing & Validation
The system features 28 automated tests covering:
- **Causality**: The dispatcher cannot look into the future.
- **Reproducibility**: Identical seeds produce bit-for-bit identical outcomes.
- **Edge Cases**: Zero-distance incidents, boundary classifications, full grid utilization.

## Security
- Strict CORS enforcement.
- Schema validation via Pydantic prevents injection.
- Complete absence of `eval()` or dangerous runtime code paths.
- See `SECURITY.md` for a full breakdown.
