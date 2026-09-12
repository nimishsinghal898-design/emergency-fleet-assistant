import threading
from typing import Dict, Optional
from app.models import RunResult

class ResultStore:
    def __init__(self):
        self._store: Dict[str, RunResult] = {}
        self._lock = threading.Lock()

    def save(self, run_id: str, result: RunResult):
        with self._lock:
            self._store[run_id] = result

    def get(self, run_id: str) -> Optional[RunResult]:
        with self._lock:
            return self._store.get(run_id)
            
    def delete(self, run_id: str):
        with self._lock:
            if run_id in self._store:
                del self._store[run_id]

# Singleton instance for the application
store = ResultStore()
