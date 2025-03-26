# scripts/dask_worker.py
from dask.distributed import Worker, Client
import openmm as mm
import openmm.app as app
import openmm.unit as unit
import numpy as np
import pandas as pd
import sys
import json
import os
import time

def run_simulation(task_id, data):
    """Runs molecular simulations using OpenMM and processes results with NumPy/Pandas."""
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
        sim_type = simulation_data.get("type", "")
        
        if not parameters:
            raise ValueError("Missing simulation parameters.")
        
        # In a real implementation, this would run the actual OpenMM simulation
        # For this example, we'll generate mock simulation data
        
        # Generate mock trajectory data based on simulation type and parameters
        timesteps = parameters.get("totalSteps", 1000)
        sample_rate = max(1, timesteps // 100)  # Sample to keep data size reasonable
        time_array = np.arange(0, timesteps, sample_rate) * parameters.get("timeStep", 0.002)
        
        temperature = parameters.get("temperature", 300)
        pressure = parameters.get("pressure", 1)
        
        # Generate simulation data with realistic patterns
        raw_simulation_data = {
            "time": time_array,
            "potential_energy": np.cumsum(np.random.normal(0, 1, len(time_array))) + 100000,
            "kinetic_energy": np.random.normal(1.5 * temperature, temperature/10, len(time_array)),
            "temperature": np.random.normal(temperature, 5, len(time_array)),
            "pressure": np.random.normal(pressure, 0.1, len(time_array)),
            "volume": np.random.normal(1000, 10, len(time_array))
        }
        
        # Process simulation data with Pandas
        df = pd.DataFrame(raw_simulation_data)
        
        # Calculate equilibration point (when energy stabilizes)
        # Use rolling mean to determine when energy stabilizes
        energy_rolling = df["potential_energy"].rolling(window=10).mean()
        # Calculate percentage change between consecutive values
        energy_pct_change = energy_rolling.pct_change().abs()
        # Find first point where change is below threshold for several consecutive points
        equilibration_idx = 0
        for i in range(20, len(energy_pct_change)):
            if all(energy_pct_change.iloc[i-5:i] < 0.001):  # 0.1% change threshold
                equilibration_idx = i
                break
        
        # Get equilibrated data
        equilibrated_df = df.iloc[equilibration_idx:]
        
        # Calculate statistics using Pandas/NumPy
        stats = {
            "mean_potential_energy": float(equilibrated_df["potential_energy"].mean()),
            "std_potential_energy": float(equilibrated_df["potential_energy"].std()),
            "mean_kinetic_energy": float(equilibrated_df["kinetic_energy"].mean()),
            "std_kinetic_energy": float(equilibrated_df["kinetic_energy"].std()),
            "mean_temperature": float(equilibrated_df["temperature"].mean()),
            "std_temperature": float(equilibrated_df["temperature"].std()),
            "mean_pressure": float(equilibrated_df["pressure"].mean()),
            "std_pressure": float(equilibrated_df["pressure"].std()),
            "mean_volume": float(equilibrated_df["volume"].mean()),
            "equilibration_time": float(time_array[equilibration_idx])
        }
        
        # For convergence analysis
        convergence = {
            "energy_rmsd": float(equilibrated_df["potential_energy"].std() / equilibrated_df["potential_energy"].mean()),
            "temperature_stability": float(equilibrated_df["temperature"].std()),
            "pressure_stability": float(equilibrated_df["pressure"].std()),
            "equilibration_percentage": float(equilibration_idx / len(df) * 100)
        }
        
        # Generate sample trajectory data (reduced size for response)
        # Sample every 10th point to reduce data size
        sample_indices = np.linspace(0, len(df)-1, 20, dtype=int)
        trajectory_sample = df.iloc[sample_indices].to_dict(orient="list")
        
        # Comprehensive result with processed data
        result = {
            "task_id": task_id,
            "status": "completed",
            "parameters": parameters,
            "simulationType": sim_type,
            "statistics": stats,
            "convergence_metrics": convergence,
            "trajectory_sample": trajectory_sample,
            "simulation_time": float(time_array[-1]),  
            "total_frames": len(df)
        }
        
    except Exception as e:
        result = {"task_id": task_id, "status": "failed", "error": str(e)}
    
    print(json.dumps(result))

if __name__ == "__main__":
    task_id = sys.argv[1] if len(sys.argv) > 1 else "unknown_task"
    json_data = sys.argv[2] if len(sys.argv) > 2 else "{}"
    
    run_simulation(task_id, json_data)