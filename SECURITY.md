# Security Posture

The Emergency Fleet Command System is designed with strict security isolation, ensuring both simulation integrity and host protection.

## Input Validation
- **Pydantic Schemas**: All incoming POST requests to `/api/simulations` are strongly typed via Pydantic (`SimulationRequest`).
- **Boundary Constraints**:
  - `seed`: Must be a valid integer.
  - `num_vehicles`: Bound between 1 and 100.
  - `num_incidents`: Bound between 1 and 500.
  - `dispatcher_type`: Restricted strictly to `baseline` or `coverage` via Enums.
- Out-of-bounds parameters instantly fail with HTTP 422 Unprocessable Entity.

## CORS Configuration
- Handled natively by FastAPI `CORSMiddleware`.
- Strictly whitelists `http://localhost:5173` and `http://127.0.0.1:5173` to prevent unauthorized cross-origin execution from malicious external dashboards.

## API Security
- **Global Exception Handler**: A global middleware captures unhandled backend exceptions and standardizes them to a clean `500 Internal Server Error` message, guaranteeing that stack traces, file paths, and environment internals are never leaked to the client.

## Unsafe Operation Prevention
- **No Evaluation Code**: The application completely abstains from dynamic code execution (`eval`, `exec`).
- **No Direct File Access Paths**: The API does not accept file paths as input. Data exports (`/export/json`, `/export/csv`) synthesize strings and bytes directly from in-memory engine objects, completely bypassing file system writes or reads that could lead to path traversal vulnerabilities.
- **Dependency Sandboxing**: The system builds under a minimal-privilege Docker image, removing unnecessary root access.

## Secrets Management
- The application relies on deterministic math and internal state tracking; there are no external database passwords, API keys, or JWT secrets to manage or leak. 
