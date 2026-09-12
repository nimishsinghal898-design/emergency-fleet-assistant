# PRODUCT REQUIREMENTS & TECHNICAL DESIGN DOCUMENT

## Project Name

**Emergency Fleet Command**

### Challenge

**AI-01 — Emergency Fleet Assignment with Coverage Preservation**

### Document Status

Master Product + Technical Specification

### Purpose

This document is the **single source of truth** for the entire project.

The implementation AI/developer MUST follow this document exactly.

The implementation must not introduce unrelated features, change challenge rules, invent requirements, or simplify the core algorithm without explicit justification.

---

# 1. PRODUCT VISION

Build a professional, industrial-style emergency fleet dispatch and simulation platform.

The system simulates an emergency response region containing 20 vehicles and 100 incidents.

The system must make online vehicle-assignment decisions while balancing:

1. Fast emergency response.
2. Priority-aware response.
3. Preservation of emergency coverage across four quadrants.
4. Efficient fleet utilization.
5. Deterministic and reproducible simulation.
6. Strict compliance with the online/causal information rule.

The final product must look like a real **Emergency Operations / Fleet Command System**, not a generic AI-generated website.

The core value of the product is the **dispatcher algorithm and simulation engine**.

The frontend exists to make the algorithm understandable, demonstrable, auditable, and professionally usable.

---

# 2. NON-NEGOTIABLE PROJECT RULES

The following rules MUST NEVER be violated.

## 2.1 No hard-coded evaluation results

The system must calculate all outputs from actual simulation data.

Never write:

```python
score = 92.5
```

or any equivalent hard-coded evaluation output.

---

## 2.2 No future information

The dispatcher is an online/causal algorithm.

At simulation minute `t`, it can only use information available at minute `t`.

It MUST NOT access:

* future incidents
* future arrival times
* future incident locations
* future priorities
* future RNG state
* future event arrays
* hidden evaluator information

---

## 2.3 No evaluator-specific logic

Do not identify evaluation cases using:

* test IDs
* special seeds
* hidden metadata
* known expected outputs
* hard-coded evaluation instances

The algorithm must work on unseen seeds and instances.

---

## 2.4 Reproducibility

The official development run must use:

```text
NumPy PCG64
Seed = 20260911
```

Running the same development configuration repeatedly must produce identical:

* generated scenario
* assignments
* simulation timeline
* metrics
* exported results

---

## 2.5 Preserve challenge rules

Do not change:

* service region size
* number of vehicles
* number of incidents
* priority probabilities
* priority weights
* vehicle speed
* busy duration
* simulation time
* quadrant definitions
* assignment order
* coverage calculation rules

unless the challenge specification explicitly permits configuration.

---

# 3. PROBLEM DEFINITION

The system receives emergency incidents over time.

For each incident, the dispatcher must decide which currently idle vehicle should respond.

A simple strategy such as always selecting the nearest vehicle can produce poor fleet-wide coverage.

Example:

If the only available vehicle in Quadrant A is sent to an incident in another quadrant, Quadrant A may temporarily have zero idle vehicles.

Therefore, the dispatcher must consider both:

```text
Response Efficiency
+
Coverage Preservation
```

The algorithm must prioritize emergency urgency while avoiding unnecessary coverage loss.

---

# 4. CHALLENGE ENVIRONMENT

## 4.1 Service region

The service region is:

```text
100 × 100
```

coordinate units.

Coordinates:

```text
x ∈ [0,100]
y ∈ [0,100]
```

---

# 5. QUADRANTS

The region contains four equal quadrants.

## Quadrant 1 — Lower Left

```text
x < 50
y < 50
```

## Quadrant 2 — Upper Left

```text
x < 50
y >= 50
```

## Quadrant 3 — Lower Right

```text
x >= 50
y < 50
```

## Quadrant 4 — Upper Right

```text
x >= 50
y >= 50
```

The boundary rule is mandatory.

For example:

```text
(50, 50) → Upper Right
(50, 20) → Lower Right
(20, 50) → Upper Left
(20, 20) → Lower Left
```

Implement quadrant classification in exactly one reusable function.

---

# 6. VEHICLES

Create:

```text
20 vehicles
```

Initial distribution:

```text
5 vehicles per quadrant
```

Initial positions must be sampled uniformly inside the corresponding quadrant.

Each vehicle must have:

```text
vehicle_id
x
y
status
current_incident
completion_time
```

All vehicles have:

```text
identical capabilities
speed = 1 coordinate unit/minute
```

---

# 7. VEHICLE STATES

Minimum states:

```text
IDLE
BUSY
```

## IDLE

Vehicle is available for assignment.

## BUSY

Vehicle is currently traveling to an incident or completing its mandatory 8-minute service period.

Only:

```text
IDLE
```

vehicles may be assigned.

---

# 8. INCIDENT GENERATION

Generate:

```text
100 incidents
```

Each incident contains:

```text
incident_id
arrival_minute
x
y
priority
```

---

## 8.1 Arrival time

Arrival minute:

```text
integer uniformly sampled from [0,59]
```

---

## 8.2 Location

Incident coordinates are uniformly sampled over the 100 × 100 service region.

---

## 8.3 Priority

Allowed priorities:

```text
1
2
3
```

Probability:

```text
P(priority=1) = 0.60
P(priority=2) = 0.30
P(priority=3) = 0.10
```

---

# 9. PRIORITY WEIGHTS

Use:

```text
Priority 1 → weight 1
Priority 2 → weight 3
Priority 3 → weight 7
```

Priority 3 is therefore significantly more important than Priority 1.

The dispatcher must explicitly account for priority.

---

# 10. TRAVEL TIME

Travel time is Euclidean distance.

For vehicle:

```text
(xv, yv)
```

and incident:

```text
(xi, yi)
```

distance is:

```text
d = sqrt((xi-xv)^2 + (yi-yv)^2)
```

Since vehicle speed is 1 coordinate unit/minute:

```text
travel_time = d
```

Do not use Manhattan distance.

Do not use approximate grid distance.

---

# 11. VEHICLE SERVICE LIFECYCLE

When a vehicle is assigned:

```text
IDLE
 ↓
TRAVELING
 ↓
INCIDENT ARRIVAL
 ↓
8-minute service period
 ↓
IDLE
```

The vehicle becomes idle at the incident location after the 8-minute service period.

Define:

```text
arrival_time = assignment_time + travel_time

completion_time = arrival_time + 8
```

The vehicle becomes idle when:

```text
completion_time <= current simulation minute
```

according to the challenge event-processing rule.

---

# 12. SIMULATION TIME

The simulation runs through integer minutes:

```text
t = 0 ... 120
```

At each integer minute execute the following exact sequence.

---

# 13. EXACT SIMULATION EVENT ORDER

For every integer minute `t`:

## Step 1 — Vehicle completions

Process all vehicle completions where:

```text
completion_time <= t
```

Such vehicles become idle.

Their position becomes the incident location.

---

## Step 2 — Reveal incidents

Reveal incidents whose:

```text
arrival_minute == t
```

Reveal them in:

```text
ascending incident_id
```

order.

Only after revelation may the dispatcher know about these incidents.

---

## Step 3 — Process waiting incidents

Process all waiting incidents using:

```text
priority descending
arrival_time ascending
incident_id ascending
```

Example:

```text
Priority 3
Priority 3
Priority 2
Priority 2
Priority 1
```

Within the same priority:

```text
earlier arrival first
```

If both are equal:

```text
lower incident ID first
```

---

## Step 4 — Assignment

For each waiting incident:

* consider currently idle vehicles only
* calculate valid candidate vehicles
* apply dispatcher policy
* assign at most one vehicle
* remove the incident from waiting queue

If no idle vehicle exists:

```text
incident remains waiting
```

It must not be discarded.

---

## Step 5 — Coverage evaluation

Immediately after all assignments at minute `t`, calculate coverage.

This ordering is mandatory.

---

# 14. ONLINE INFORMATION BOUNDARY

This is one of the most important parts of the system.

The simulation engine may internally know the complete generated scenario.

However, the dispatcher must NOT receive the complete scenario.

The dispatcher API should receive a snapshot similar to:

```text
CurrentTime
CurrentlyRevealedIncidents
WaitingIncidents
CurrentVehicleStates
PastAssignments
PastOutcomes
```

It must NOT receive:

```text
FutureIncidents
FutureIncidentArray
FutureRNGState
HiddenEvaluationMetadata
```

The architecture should make accidental access difficult.

---

# 15. REQUIRED ARCHITECTURE

Use clear separation.

```text
frontend/
backend/
```

Backend:

```text
backend/
├── api/
├── models/
├── simulation/
├── dispatcher/
├── metrics/
├── services/
├── tests/
├── config/
└── run_simulation.py
```

Frontend:

```text
frontend/
├── components/
├── pages/
├── charts/
├── services/
├── hooks/
├── types/
├── utils/
└── app/
```

---

# 16. TECHNOLOGY STACK

Use:

## Frontend

```text
React
TypeScript
Tailwind CSS
Recharts
```

## Backend

```text
Python
FastAPI
Pydantic
NumPy
```

## Testing

```text
pytest
frontend test framework appropriate for React
```

## Deployment

```text
Docker
Docker Compose
```

Do not introduce additional frameworks unless they solve a clear requirement.

Avoid unnecessary dependencies.

---

# 17. CORE DISPATCHER OBJECTIVE

The dispatcher must optimize the overall system rather than only the current incident.

The policy should balance:

```text
Priority urgency
+
Response time
+
Coverage preservation
+
Vehicle availability
```

---

# 18. DISPATCHER ALGORITHM

Implement a transparent scoring-based policy.

For each waiting incident `i` and each currently idle vehicle `v`, calculate a candidate score.

The score must consider:

1. Incident priority.
2. Estimated response time.
3. Coverage impact.
4. Vehicle scarcity.
5. Deterministic tie-breaking.

---

# 19. PRIORITY URGENCY

Use:

```text
w(1) = 1
w(2) = 3
w(3) = 7
```

Higher priority must produce stronger urgency.

Do not treat all incidents equally.

---

# 20. RESPONSE-TIME COMPONENT

Calculate:

```text
distance(vehicle, incident)
```

as Euclidean distance.

Lower distance should generally be preferred.

The algorithm must avoid unnecessarily sending a far-away vehicle when a comparable nearby vehicle is available.

---

# 21. COVERAGE PRESERVATION

Before assigning a vehicle, calculate idle vehicles per quadrant.

Example:

```text
LL = 2
UL = 4
LR = 1
UR = 3
```

If selecting the only idle vehicle in LR would produce:

```text
LR = 0
```

the candidate should receive a significant coverage penalty.

If another reasonable vehicle can serve the incident without causing an outage, prefer the safer option.

---

# 22. VEHICLE SCARCITY

A vehicle from a quadrant containing very few idle vehicles should be considered more valuable for coverage.

Example:

```text
Quadrant A → 1 idle vehicle
Quadrant B → 5 idle vehicles
```

The vehicle in Quadrant A is more scarce.

The dispatcher should avoid removing it unless the incident urgency/response benefit justifies it.

---

# 23. SCORING DESIGN

Implement the scoring policy with configurable coefficients.

Conceptually:

```text
Candidate Score =
    Priority/urgency benefit
    - Response-time cost
    - Coverage-risk penalty
    - Scarcity penalty
```

The exact coefficients must be documented and configurable.

Do not hide arbitrary constants throughout the source code.

Keep them in a dispatcher configuration object.

Example conceptual configuration:

```text
DispatcherConfig:
    response_weight
    coverage_weight
    scarcity_weight
    priority_weight
```

The final coefficients must be selected through local development experiments and documented.

Do not tune exclusively to one development seed.

---

# 24. IMPORTANT ALGORITHM PRINCIPLE

Coverage must NOT completely override emergency priority.

Example:

If a Priority-3 emergency is waiting and every available vehicle has some coverage cost, the system should still respond appropriately.

Coverage preservation is a system-level objective, not a reason to ignore urgent emergencies.

Therefore:

```text
Priority urgency > moderate coverage preference
```

but:

```text
unnecessary coverage loss should be avoided.
```

---

# 25. DISPATCH DECISION PROCESS

For each waiting incident:

```text
1. Get currently idle vehicles.
2. If none exist:
       keep incident waiting.
3. Calculate candidate distance.
4. Calculate resulting quadrant idle counts.
5. Calculate coverage risk.
6. Calculate vehicle scarcity.
7. Calculate priority-aware candidate score.
8. Select best candidate.
9. Validate assignment.
10. Record assignment.
11. Update vehicle state.
```

---

# 26. DETERMINISTIC TIE BREAKING

The dispatcher must always produce deterministic results.

Recommended final tie-break order:

```text
1. Higher incident priority
2. Earlier arrival time
3. Lower incident ID
4. Lower estimated response time
5. Lower vehicle ID
```

If candidates still tie, use:

```text
lower vehicle ID
```

Never use uncontrolled randomness for tie-breaking.

---

# 27. WAITING QUEUE

If no vehicle is available, the incident stays in the queue.

It must not be:

* deleted
* skipped permanently
* reassigned incorrectly
* marked completed

When vehicles become available, waiting incidents are reconsidered according to the required queue order.

---

# 28. ASSIGNMENT RECORD

Every assignment must record:

```text
assignment_id
incident_id
vehicle_id
priority
dispatch_time
vehicle_x_before
vehicle_y_before
incident_x
incident_y
distance
response_time
arrival_time
completion_time
vehicle_quadrant_before
idle_counts_before
idle_counts_after
```

This creates a complete audit trail.

---

# 29. COVERAGE METRIC

Coverage is evaluated:

```text
after assignments
at every integer minute
0 through 120
```

For each minute calculate:

```text
idle_LL
idle_UL
idle_LR
idle_UR
```

If ANY quadrant has:

```text
idle_count == 0
```

then that minute counts as one coverage-outage minute.

---

# 30. COVERAGE OUTPUT

Store:

```text
minute
idle_LL
idle_UL
idle_LR
idle_UR
coverage_healthy
outage
```

Also calculate:

```text
total_outage_minutes
outage_minutes_LL
outage_minutes_UL
outage_minutes_LR
outage_minutes_UR
```

---

# 31. RESPONSE METRICS

For every successfully assigned incident:

```text
response_time =
arrival_time - dispatch_time
```

---

# 32. PRIORITY-WEIGHTED RESPONSE METRIC

For each incident:

```text
weighted_response =
priority_weight × response_time
```

where:

```text
P1 → 1
P2 → 3
P3 → 7
```

Report:

```text
weighted response sum
weighted response mean
```

The weighted mean should be normalized appropriately so runs are comparable.

---

# 33. PRIORITY-3 METRICS

Calculate specifically for Priority-3 incidents:

```text
mean response time
median response time
maximum response time
minimum response time
count
```

---

# 34. ASSIGNMENT VALIDITY METRICS

Track:

```text
total incidents
assigned incidents
waiting incidents
invalid assignment attempts
duplicate assignments
assignments to busy vehicles
assignments before reveal
```

Expected invalid counts should be zero.

---

# 35. RUNTIME METRICS

Measure:

```text
simulation runtime
dispatcher runtime
metrics runtime
total runtime
```

Do not artificially optimize by removing correctness checks.

---

# 36. BASELINE COMPARISON

Implement a simple baseline dispatcher:

```text
Nearest Idle Vehicle
```

This baseline is only for development comparison.

It must remain separate from the final competition dispatcher.

Compare:

```text
Baseline
vs
Coverage-Aware Priority Dispatcher
```

using:

* weighted response
* P3 response
* coverage outage
* assignment validity
* runtime

This comparison is for development and must not use hidden evaluation data.

---

# 37. MULTI-SEED DEVELOPMENT EVALUATION

Support testing on multiple locally chosen seeds.

Example:

```text
20260911
20260912
20260913
```

The purpose is robustness testing.

The algorithm must not be designed specifically around one seed.

The final challenge seed and unseen evaluation seeds must remain supported.

---

# 38. BACKEND API

Required endpoints:

```text
GET /api/health

POST /api/simulations

GET /api/simulations/{run_id}

GET /api/simulations/{run_id}/timeline

GET /api/simulations/{run_id}/vehicles

GET /api/simulations/{run_id}/incidents

GET /api/simulations/{run_id}/assignments

GET /api/simulations/{run_id}/metrics

GET /api/simulations/{run_id}/coverage

GET /api/simulations/{run_id}/export/json

GET /api/simulations/{run_id}/export/csv
```

The API must expose actual simulation data.

Never return fake dashboard data.

---

# 39. FRONTEND PRODUCT STRUCTURE

The application should contain:

```text
Overview
Live Simulation
Fleet
Incidents
Coverage
Assignments
Performance
Export
Technical Details
```

---

# 40. OVERVIEW SCREEN

Display:

```text
Active Incidents
Waiting Incidents
Available Vehicles
Busy Vehicles
Coverage Health
Weighted Response
Priority-3 Response
Coverage Outage Minutes
```

The values must come from the backend.

---

# 41. LIVE SIMULATION SCREEN

Display a professional 100 × 100 service-region map.

Show:

* four quadrants
* vehicles
* incidents
* priorities
* vehicle status
* assignments
* movement/path where useful
* current simulation time
* coverage status

The map must use actual simulation coordinates.

---

# 42. SIMULATION CONTROLS

Provide:

```text
Play
Pause
Restart
Step Forward
Step Back
Speed
Jump to Minute
```

Timeline:

```text
0 → 120
```

The replay must use recorded backend events.

The frontend must NOT implement another dispatcher.

---

# 43. EVENT LOG

Display events such as:

```text
00:12 — Incident 27 revealed — Priority 3
00:12 — Vehicle V08 assigned
00:19 — Vehicle V03 completed service
```

Use actual event data.

---

# 44. FLEET SCREEN

For each vehicle display:

```text
Vehicle ID
Status
Current Position
Current Quadrant
Assigned Incident
Completion Time
```

Allow sorting/filtering.

---

# 45. INCIDENT SCREEN

Display:

```text
Incident ID
Arrival Time
Priority
Location
Status
Assigned Vehicle
Dispatch Time
Response Time
Completion Time
```

Statuses:

```text
Waiting
Assigned
Completed
```

---

# 46. COVERAGE SCREEN

Display four quadrant panels.

Each quadrant should show:

```text
Idle Vehicles
Busy Vehicles
Coverage Status
Outage Minutes
```

Use meaningful status indicators.

---

# 47. PERFORMANCE SCREEN

Charts:

```text
Response Time Distribution
Weighted Response by Priority
Priority-3 Response
Coverage Outage Timeline
Idle Vehicles by Quadrant
Assignments Over Time
```

All charts must use actual backend results.

---

# 48. ASSIGNMENT AUDIT SCREEN

Create a professional audit table containing assignment records.

Allow:

```text
search
filter
sort
```

Filters:

```text
priority
vehicle
incident
time
```

---

# 49. EXPORT SCREEN

Allow exporting:

```text
results.json
results.csv
assignments.csv
coverage.csv
```

Exports must be generated from actual simulation data.

---

# 50. TECHNICAL DETAILS SCREEN

Explain:

```text
Problem
Simulation
Online Dispatcher
Priority Weighting
Coverage Preservation
Causal Design
Metrics
Validation
```

Use simple language so judges can understand the system.

---

# 51. UI/UX DESIGN REQUIREMENTS

The interface must look like a professional enterprise emergency operations system.

Design inspiration:

```text
Emergency Operations Center
Fleet Control Room
Dispatch Management System
Enterprise Logistics Platform
```

Avoid the common generic AI-generated design style.

DO NOT use excessive:

* gradients
* glassmorphism
* glowing effects
* floating decorative cards
* huge headings
* unnecessary animations
* random illustrations
* marketing slogans
* excessive rounded containers

Use:

* strong information hierarchy
* restrained colors
* readable typography
* compact data tables
* operational status indicators
* meaningful charts
* clear spacing
* consistent components

---

# 52. COLOR SEMANTICS

Use colors only where they communicate meaning.

Suggested semantics:

```text
Green → available/healthy
Red → emergency/critical/outage
Amber → warning
Blue → informational
Neutral → normal data
```

Do not turn the entire interface into a rainbow.

---

# 53. SECURITY REQUIREMENTS

The system must follow secure engineering practices.

## Backend

Implement:

* strict input validation
* Pydantic schemas
* bounded numeric inputs
* secure CORS
* environment-based configuration
* safe error handling
* no secret exposure
* no arbitrary file paths
* no arbitrary command execution
* no `eval`
* no `exec`
* no unsafe deserialization

---

# 54. FRONTEND SECURITY

Never expose:

* secret API keys
* private credentials
* server secrets

Do not unnecessarily store sensitive data in localStorage.

Do not render untrusted HTML.

Validate URLs and external resources.

---

# 55. ERROR HANDLING

The application must handle:

```text
API failure
Invalid seed
Invalid configuration
Simulation failure
Empty result
Network failure
Malformed response
```

Show users understandable messages.

Do not expose Python stack traces to normal users.

Detailed errors may be logged server-side.

---

# 56. TESTING REQUIREMENTS

Create automated tests for:

## Simulation

* 20 vehicles
* 100 incidents
* correct quadrant distribution
* valid coordinates
* valid priorities
* valid arrival times
* deterministic seed
* different seeds
* Euclidean distance
* 8-minute service
* completion processing
* minute ordering

---

# 57. EDGE CASE TESTS

Test:

1. No idle vehicles.
2. All vehicles busy.
3. Multiple incidents arriving at same minute.
4. Same priority.
5. Same arrival time.
6. Same location.
7. Vehicle already at incident.
8. x = 50.
9. y = 50.
10. completion exactly at current minute.
11. multiple simultaneous completions.
12. long waiting queue.
13. all vehicles concentrated in one quadrant.
14. P3 incident while all vehicles are busy.
15. unseen seeds.
16. repeated same-seed execution.

---

# 58. CAUSALITY TESTING

This is mandatory.

Create a test demonstrating that changing future incidents while keeping the current visible state unchanged does NOT change the current dispatcher decision.

The dispatcher must not be able to access future incidents.

The test should fail if future information accidentally leaks into the dispatcher.

---

# 59. REPRODUCIBILITY TEST

Run:

```text
seed = 20260911
```

multiple times.

Verify identical:

```text
scenario
assignments
metrics
exports
```

---

# 60. API TESTING

Test:

```text
health
simulation creation
result retrieval
metrics retrieval
coverage retrieval
assignment retrieval
exports
invalid inputs
error handling
```

---

# 61. FRONTEND TESTING

Verify:

* routes work
* API loading works
* API failure works
* empty states work
* charts render
* simulation controls work
* filters work
* exports work
* no console errors
* no broken UI components

---

# 62. PERFORMANCE

The simulation should execute quickly.

Avoid:

* unnecessary database operations
* unnecessary API requests
* repeated expensive calculations
* excessive frontend rendering

Do not sacrifice algorithm correctness for speed.

---

# 63. DATA FLOW

The intended flow is:

```text
Seed
 ↓
Scenario Generator
 ↓
Simulation Engine
 ↓
Current Simulation State
 ↓
Causal Dispatcher
 ↓
Assignment
 ↓
Vehicle State Update
 ↓
Coverage Calculation
 ↓
Metrics Engine
 ↓
Run Result
 ↓
FastAPI
 ↓
React Dashboard
```

---

# 64. IMPORTANT ARCHITECTURAL RULE

There must be exactly one authoritative implementation of:

```text
simulation rules
dispatcher rules
metrics
```

The frontend must never recreate these rules.

The frontend only visualizes backend results.

---

# 65. CONFIGURATION

Keep configurable values in a central configuration structure.

Example:

```text
SimulationConfig
DispatcherConfig
MetricConfig
```

Challenge defaults must be clearly defined.

Avoid magic numbers scattered throughout the code.

---

# 66. LOGGING

Use structured logs for important events:

```text
simulation_started
incident_revealed
assignment_created
vehicle_completed
coverage_outage
simulation_completed
```

Do not log secrets.

---

# 67. PROJECT FILES

Final project should contain approximately:

```text
README.md
QUICKSTART.md
TECHNICAL_DESIGN.md
ALGORITHM.md
SECURITY.md
TESTING.md
QA_REPORT.md

requirements.txt / pyproject.toml
package.json
.env.example
Dockerfile
docker-compose.yml

backend/
frontend/
tests/
```

Do not create unnecessary documentation files.

---

# 68. ONE-COMMAND EXECUTION

The project must have a simple documented startup command.

Preferred:

```bash
docker compose up --build
```

If native execution is provided, document it clearly.

---

# 69. DEVELOPMENT CLI

Support:

```bash
python -m backend.run_simulation --seed 20260911
```

This must generate actual results.

Also support evaluation of multiple development seeds.

---

# 70. OUTPUT FILES

Generate:

```text
results.json
results.csv
assignments.csv
coverage.csv
```

Never manually fabricate output files.

---

# 71. DEMONSTRATION WORKFLOW

The final demo should be:

```text
Open application
      ↓
Overview
      ↓
Start Simulation
      ↓
Show Live Simulation
      ↓
Show emergency incidents
      ↓
Show vehicle assignments
      ↓
Show coverage preservation
      ↓
Show performance metrics
      ↓
Compare baseline
      ↓
Show technical explanation
      ↓
Export results
```

The demo should be understandable without technical knowledge.

---

# 72. INDUSTRIAL DESIGN PRINCIPLES

Follow these principles:

## Separation of concerns

Simulation, dispatcher, metrics, API and UI must remain separate.

## Single responsibility

Each module should have a clear purpose.

## Determinism

Same input configuration should produce same output.

## Auditability

Every important dispatch decision should be traceable.

## Observability

Important simulation events should be visible through logs and UI.

## Defensive programming

Validate assumptions and reject invalid state transitions.

## Maintainability

Use clean naming, type hints and documentation.

## Testability

Core algorithms must be testable independently of the UI.

---

# 73. THINGS THE IMPLEMENTATION MUST NOT DO

Do NOT:

* invent unrelated features
* add authentication unless explicitly required
* add payment systems
* add user accounts
* add chat
* add maps requiring external API keys
* add unnecessary AI/LLM features
* add blockchain
* add databases unless genuinely necessary
* use fake data in the dashboard
* hard-code metrics
* use future incidents
* use future RNG state
* create a second frontend dispatcher algorithm
* modify challenge rules for convenience
* overcomplicate the architecture

The goal is a strong, focused competition solution.

---

# 74. "AI" REQUIREMENT

The challenge is titled AI-01, but the solution does NOT need unnecessary generative AI.

The core intelligence is the online optimization/decision-making algorithm.

Do not add ChatGPT, LLMs, chatbots, or generative AI unless there is a genuine requirement.

The dispatcher itself is the intelligent component.

---

# 75. DEVELOPMENT STRATEGY

Build in this exact order:

```text
PHASE 1
Simulation Engine

PHASE 2
Dispatcher

PHASE 3
Metrics + Baseline

PHASE 4
FastAPI Backend

PHASE 5
Frontend Dashboard

PHASE 6
Live Simulation Replay

PHASE 7
Security + QA

PHASE 8
Industrial UI Polish

PHASE 9
Documentation + Submission
```

Do not start with UI polish before the simulation and dispatcher are validated.

---

# 76. DEFINITION OF DONE

The project is complete only when:

### Algorithm

* [ ] dispatcher works
* [ ] priority-aware
* [ ] coverage-aware
* [ ] deterministic
* [ ] causal

### Simulation

* [ ] 20 vehicles
* [ ] 100 incidents
* [ ] correct distributions
* [ ] correct event ordering
* [ ] correct vehicle lifecycle
* [ ] correct coverage evaluation

### Metrics

* [ ] weighted response
* [ ] P3 response
* [ ] coverage outage
* [ ] validity metrics
* [ ] runtime

### Backend

* [ ] APIs work
* [ ] validation works
* [ ] errors handled
* [ ] security checks completed

### Frontend

* [ ] dashboard works
* [ ] simulation visualization works
* [ ] fleet page works
* [ ] incident page works
* [ ] coverage page works
* [ ] performance page works
* [ ] exports work

### Testing

* [ ] unit tests pass
* [ ] integration tests pass
* [ ] causality tests pass
* [ ] reproducibility tests pass
* [ ] edge cases pass
* [ ] frontend tests pass

### Deployment

* [ ] clean environment works
* [ ] Docker build works
* [ ] one-command startup works

### Documentation

* [ ] README
* [ ] architecture
* [ ] algorithm
* [ ] security
* [ ] testing
* [ ] quick start

---

# 77. IMPLEMENTATION AI INSTRUCTIONS

When implementing this project:

1. Read this entire document before modifying code.
2. Treat this document as the authoritative specification.
3. Do not invent missing product requirements unnecessarily.
4. If a technical implementation detail is unspecified, choose the simplest professional solution that preserves the stated requirements.
5. Do not change challenge rules.
6. Do not hard-code evaluation results.
7. Do not leak future information to the dispatcher.
8. Do not duplicate business logic in the frontend.
9. Keep modules separated.
10. Test every major change.
11. Fix errors before moving to the next phase.
12. Preserve working functionality.
13. Do not rewrite working components without a reason.
14. Prefer maintainable, readable code over clever code.
15. Use real data everywhere.
16. Do not use placeholder data in the final application.
17. Do not add unrelated features.
18. Do not optimize for only seed 20260911.
19. Verify unseen seeds locally.
20. Before final completion, perform a clean end-to-end test.

---

# 78. FINAL QUALITY STANDARD

The final system should feel like:

> "A small professional emergency fleet operations platform built for an optimization challenge."

It should NOT feel like:

> "A generic AI-generated dashboard made for a college project."

The most important priorities are:

```text
1. Correctness
2. Online-rule compliance
3. Dispatcher quality
4. Coverage preservation
5. Reproducibility
6. Testing
7. Security
8. Professional UX
9. Documentation
10. Visual polish
```

When there is a conflict between visual appearance and algorithmic correctness:

```text
CORRECTNESS WINS.
```

When there is a conflict between adding a new feature and keeping the system focused:

```text
FOCUS WINS.
```

When there is a conflict between a shortcut and the published challenge rules:

```text
CHALLENGE RULES WIN.
```

This document is the controlling specification for the project.
