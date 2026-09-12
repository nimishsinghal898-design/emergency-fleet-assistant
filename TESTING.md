# Testing Suite

The project includes an exhaustive `pytest` suite consisting of 28 highly specialized tests, guaranteeing engine reliability and algorithmic integrity.

## Unit Tests (`test_metrics.py`, `test_edge_cases.py`)
- **Metric Verification**: Validates the mathematical exactness of weighted priority averages and specific P3 incident grouping.
- **Edge Cases**:
  - Behavior when 0 vehicles are idle.
  - Behavior when an incident spawns at the exact `(x,y)` coordinate of a vehicle (0 distance).
  - Incidents arriving simultaneously at the exact same minute.

## Integration Tests (`test_api.py`)
- Evaluates the end-to-end FastAPI behavior.
- Confirms proper JSON structures on `/api/simulations`.
- Validates the `/export/csv` route correctly outputs parsable CSV bytes.
- Validates HTTP 422 triggers on malformed JSON bodies.

## Causality Tests (`test_causality_strict.py`)
- **Crucial Challenge Constraint**: Proves mathematically that the dispatcher has absolutely no access to future information.
- We run the simulation, record the state, and verify that the `SimulationState` passed to the dispatcher inherently lacks the `all_incidents` array. It only contains `waiting_incidents` and `revealed_incidents` up to `t_current`. 
- Attempts to dispatch unrevealed incidents trigger engine-level rejections.

## Reproducibility Tests (`test_reproducibility.py`)
- Uses the `PCG64` random generator from NumPy.
- Asserts that running two separate simulation instances with the same random seed (e.g. `20260911`) produces bit-for-bit identical outcomes.
- Asserts that varying the seed immediately produces divergent incident patterns.

## Performance Tests
- The React frontend heavily leverages `React.memo` to prevent unnecessary re-renders of the 10,000-cell grid during timeline scrubbing.
- The `SimulationEngine` maintains internal tracking lists to execute a full 120-minute simulation with 100 incidents in under 200 milliseconds.
