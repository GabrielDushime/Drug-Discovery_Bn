from dask.distributed import Worker, Client
import sys
import json
import time

def run_simulation(task_id, data):
    """Simulates a molecular dynamics computation (placeholder for OpenMM integration)."""
    print(f"Running simulation for task {task_id} with data: {data}", file=sys.stderr)
    
    # Parse the data to extract simulation details
    try:
        simulation_data = json.loads(data)
        
        # Check if we have molecular model info
        model_name = simulation_data.get('modelName', 'Unknown Model')
        simulation_type = simulation_data.get('type', 'Unknown Type')
        
        time.sleep(5)  # Simulate computation time
        
        # Create a more informative result with the molecular model name
        result = {
            "task_id": task_id,
            "status": "completed",
            "modelName": model_name,
            "simulationType": simulation_type,
            "computationTime": "5 seconds",
            "metrics": {
                "energy": -500.23,
                "temperature": 310.15,
                "rmsd": 1.25
            }
        }
    except json.JSONDecodeError:
        # Fallback if data isn't valid JSON
        result = {
            "task_id": task_id,
            "status": "completed",
            "output": f"Results for {data}"
        }
    
    return result

if __name__ == "__main__":
    task_id = sys.argv[1]
    data = sys.argv[2]
    
    result = run_simulation(task_id, data)
    # Only output the JSON result to stdout for NestJS to parse
    print(json.dumps(result))