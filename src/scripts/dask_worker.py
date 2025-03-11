# scripts/dask_worker.py
from dask.distributed import Worker, Client
import openmm as mm
import openmm.app as app
import openmm.unit as unit
import numpy as np
import sys
import json
import os
import time

import json
import sys
def run_simulation(task_id, data):
    """Runs molecular simulations using OpenMM based on the provided parameters."""
    try:
        print(f"Received Task ID: {task_id}", file=sys.stderr)
        print(f"Received Raw Data: {data}", file=sys.stderr)

        # Ensure proper JSON parsing
        if isinstance(data, str):
            data = data.strip("'")  # Remove surrounding single quotes if present
            simulation_data = json.loads(data)
        else:
            simulation_data = data

        # Extract parameters
        parameters = simulation_data.get("parameters", {})
        if not parameters:
            raise ValueError("Missing simulation parameters.")

        # Mock response
        result = {
            "task_id": task_id,
            "status": "completed",
            "parameters": parameters,
        }
    
    except Exception as e:
        result = {"task_id": task_id, "status": "failed", "error": str(e)}

    print(json.dumps(result))

if __name__ == "__main__":
    task_id = sys.argv[1] if len(sys.argv) > 1 else "unknown_task"
    json_data = sys.argv[2] if len(sys.argv) > 2 else "{}"

    run_simulation(task_id, json_data)