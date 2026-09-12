import json
import csv
from pathlib import Path
from app.models import RunResult

def export_run_result(result: RunResult, out_dir: str = "."):
    """
    Exports the RunResult object to stable, machine-readable JSON and CSV files.
    """
    out_path = Path(out_dir)
    out_path.mkdir(exist_ok=True, parents=True)
    
    # results.json
    results_json = result.model_dump()
    with open(out_path / "results.json", "w") as f:
        json.dump(results_json, f, indent=2)
        
    # assignments.csv
    with open(out_path / "assignments.csv", "w", newline='') as f:
        if result.assignments:
            writer = csv.DictWriter(f, fieldnames=result.assignments[0].model_dump().keys())
            writer.writeheader()
            for a in result.assignments:
                writer.writerow(a.model_dump())
                
    # coverage.csv
    with open(out_path / "coverage.csv", "w", newline='') as f:
        if result.coverage_timeline:
            writer = csv.DictWriter(f, fieldnames=result.coverage_timeline[0].model_dump().keys())
            writer.writeheader()
            for c in result.coverage_timeline:
                writer.writerow(c.model_dump())
                
    # results.csv (flat metrics for easy reading)
    with open(out_path / "results.csv", "w", newline='') as f:
        # We combine metrics, validation_results, and basic summary into a flat dictionary
        flat_metrics = {
            "seed": result.seed,
            **result.scenario_summary.model_dump(),
            **result.validation_results.model_dump(),
            **result.metrics.model_dump(),
            "simulation_runtime": result.simulation_runtime,
            "dispatcher_runtime": result.dispatcher_runtime,
            "metrics_runtime": result.metrics_runtime,
            "total_runtime": result.total_runtime
        }
        writer = csv.DictWriter(f, fieldnames=flat_metrics.keys())
        writer.writeheader()
        writer.writerow(flat_metrics)
