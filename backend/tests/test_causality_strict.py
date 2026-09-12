import pytest
import copy
from app.simulation import SimulationEngine
from app.dispatcher import CoverageAwareDispatcher

def test_dispatcher_causality():
    """
    Proves that the dispatcher's decision at time t is strictly causal
    and does not depend on future incidents, future random state, or 
    pre-generated arrays.
    """
    
    # 1. Run a normal simulation up to minute 10
    engine1 = SimulationEngine(seed=20260911, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=100)
    
    # We step manually until t=10
    while engine1.t < 10:
        engine1.step()
        
    # At t=10, we record the state and the assignments made so far
    assignments1_at_10 = copy.deepcopy(engine1.past_assignments)
    
    # 2. We will now create a modified engine that shares the EXACT same past up to t=10
    # But has completely altered future incidents.
    engine2 = SimulationEngine(seed=20260911, dispatcher=CoverageAwareDispatcher(), num_vehicles=20, num_incidents=100)
    
    # Manually tamper with incidents that arrive strictly AFTER t=10
    for incident in engine2.all_incidents:
        if incident.arrival_minute > 10:
            # Change priority, arrival time, and location completely
            incident.priority = 3 if incident.priority == 1 else 1
            incident.x = 99
            incident.y = 99
            incident.arrival_minute = 119 # Push them all to the end
            
    # Now step engine2 up to t=10
    while engine2.t < 10:
        engine2.step()
        
    assignments2_at_10 = engine2.past_assignments
    
    # 3. VERIFY CAUSALITY:
    # If the dispatcher used future information (like peeking at engine2.incidents),
    # its decisions might have changed. But because it should only see revealed incidents,
    # the assignments MUST be identical.
    
    assert len(assignments1_at_10) == len(assignments2_at_10), "Number of assignments diverge due to future state change!"
    
    for a1, a2 in zip(assignments1_at_10, assignments2_at_10):
        assert a1.incident_id == a2.incident_id
        assert a1.vehicle_id == a2.vehicle_id
        assert a1.dispatch_time == a2.dispatch_time
        
    # Further, let's step to minute 10 itself to see if the current minute's assignment is identical
    engine1.step()
    engine2.step()
    
    # The assignments made EXACTLY at minute 10 must also be identical, 
    # because the future (minute 11+) is different but minute 10 is the same.
    assert len(engine1.past_assignments) == len(engine2.past_assignments)
    for a1, a2 in zip(engine1.past_assignments, engine2.past_assignments):
        assert a1.incident_id == a2.incident_id
        assert a1.vehicle_id == a2.vehicle_id
        assert a1.dispatch_time == a2.dispatch_time

