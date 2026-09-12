import pytest
from app.simulation import SimulationEngine
from app.models import VehicleStatus as VehicleState, Vehicle, Incident
from app.dispatcher import CoverageAwareDispatcher

def create_mock_engine(vehicles=None, incidents=None):
    engine = SimulationEngine(seed=1, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=0)
    if vehicles is not None:
        engine.vehicles = vehicles
    if incidents is not None:
        engine.all_incidents = incidents
    return engine

def test_no_idle_vehicle():
    """Edge Case 1: No idle vehicle available, incident should wait."""
    vehicles = [Vehicle(id=str(i), x=10, y=10, status=VehicleState.BUSY) for i in range(20)]
    incidents = [Incident(id="1", arrival_minute=0, x=50, y=50, priority=1)]
    engine = create_mock_engine(vehicles, incidents)
    engine.step()
    assert len(engine.past_assignments) == 0
    assert len(engine._get_waiting_incidents()) == 1

def test_multiple_incidents_same_minute():
    """Edge Case 3 & 4 & 5: Multiple incidents same minute, same priority, same arrival time."""
    vehicles = [Vehicle(id=str(i), x=10, y=10, status=VehicleState.IDLE) for i in range(20)]
    incidents = [
        Incident(id="2", arrival_minute=0, x=50, y=50, priority=1),
        Incident(id="1", arrival_minute=0, x=60, y=60, priority=1)
    ]
    engine = create_mock_engine(vehicles, incidents)
    engine.step()
    # ID 1 should be processed before ID 2 because of tie-breaking rules
    assert len(engine.past_assignments) == 2
    assert engine.past_assignments[0].incident_id == "1"
    assert engine.past_assignments[1].incident_id == "2"

def test_same_coordinates():
    """Edge Case 6: Same coordinates, distance is 0."""
    vehicles = [Vehicle(id="1", x=50, y=50, status=VehicleState.IDLE)]
    incidents = [Incident(id="1", arrival_minute=0, x=50, y=50, priority=1)]
    engine = create_mock_engine(vehicles, incidents)
    engine.step()
    assert engine.past_assignments[0].distance == 0
    assert engine.past_assignments[0].response_time == 0

def test_vehicle_exactly_at_incident():
    """Edge Case 7: Vehicle exactly at incident."""
    test_same_coordinates()

def test_boundaries():
    """Edge Case 8 & 9: x=50, y=50 boundaries."""
    # x=50, y=50 is Upper Right (x >= 50, y >= 50)
    assert Vehicle(id="1", x=50, y=50).get_quadrant() == "UPPER_RIGHT"
    # x=50, y=49 is Lower Right
    assert Vehicle(id="1", x=50, y=49).get_quadrant() == "LOWER_RIGHT"
    # x=49, y=50 is Upper Left
    assert Vehicle(id="1", x=49, y=50).get_quadrant() == "UPPER_LEFT"
    # x=49, y=49 is Lower Left
    assert Vehicle(id="1", x=49, y=49).get_quadrant() == "LOWER_LEFT"

def test_completion_exactly_current_minute():
    """Edge Case 10 & 11: Completion exactly at current minute."""
    vehicles = [
        Vehicle(id="1", x=10, y=10, status=VehicleState.BUSY, completion_time=1),
        Vehicle(id="2", x=20, y=20, status=VehicleState.BUSY, completion_time=1)
    ]
    engine = create_mock_engine(vehicles, [])
    engine.t = 1
    engine.step()
    # Step 1 inside engine.step() handles completions where completion_time <= current_minute
    assert vehicles[0].status == VehicleState.IDLE
    assert vehicles[1].status == VehicleState.IDLE

def test_priority3_when_all_busy():
    """Edge Case 14: P3 incident arrives while all vehicles are busy."""
    vehicles = [Vehicle(id=str(i), x=10, y=10, status=VehicleState.BUSY, completion_time=5) for i in range(20)]
    incidents = [Incident(id="1", arrival_minute=0, x=50, y=50, priority=3)]
    engine = create_mock_engine(vehicles, incidents)
    engine.step()
    assert len(engine.past_assignments) == 0
    assert len(engine._get_waiting_incidents()) == 1
    # Advance to minute 5
    for _ in range(5):
        engine.step()
    assert len(engine.past_assignments) == 1
    assert engine.past_assignments[0].incident_id == "1"
    assert engine.past_assignments[0].dispatch_time == 5
    assert engine.past_assignments[0].response_time == 5 + engine.past_assignments[0].distance
