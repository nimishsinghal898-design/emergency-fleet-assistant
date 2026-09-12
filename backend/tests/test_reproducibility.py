import pytest
from app.simulation import SimulationEngine
from app.dispatcher import CoverageAwareDispatcher
from app.metrics import build_run_result

def test_reproducibility():
    """
    Proves that running the engine multiple times with the same seed
    produces perfectly identical assignments and metrics.
    """
    
    # Run 1
    engine1 = SimulationEngine(seed=20260911, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=100)
    engine1.run()
    res1 = build_run_result(engine1, 1.0)
    
    # Run 2
    engine2 = SimulationEngine(seed=20260911, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=100)
    engine2.run()
    res2 = build_run_result(engine2, 1.0)
    
    # Run 3 (different seed to ensure it does change)
    engine3 = SimulationEngine(seed=12345, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=100)
    engine3.run()
    res3 = build_run_result(engine3, 1.0)
    
    # Assert identical scenarios
    assert len(res1.incidents) == len(res2.incidents)
    for i1, i2 in zip(res1.incidents, res2.incidents):
        assert i1.x == i2.x and i1.y == i2.y and i1.arrival_minute == i2.arrival_minute
        
    # Assert identical metrics
    assert res1.metrics.weighted_response_mean == res2.metrics.weighted_response_mean
    assert res1.metrics.p3_mean_response == res2.metrics.p3_mean_response
    assert res1.metrics.total_outage_minutes == res2.metrics.total_outage_minutes
    
    # Assert identical assignments
    assert len(res1.assignments) == len(res2.assignments)
    for a1, a2 in zip(res1.assignments, res2.assignments):
        assert a1.incident_id == a2.incident_id
        assert a1.vehicle_id == a2.vehicle_id
        assert a1.dispatch_time == a2.dispatch_time
        
    # Assert it differs from run 3
    assert res1.metrics.weighted_response_mean != res3.metrics.weighted_response_mean
