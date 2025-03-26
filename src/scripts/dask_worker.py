#!/usr/bin/env python3
import sys
import json
import time
import traceback
import numpy as np
import platform
import shutil

def molecular_dynamics_simulation(parameters):
    """
    Mock molecular dynamics simulation 
    In a real scenario, this would use libraries like OpenMM or MDAnalysis
    """
    try:
        # Extract parameters with robust default handling
        temperature = float(parameters.get('temperature', 310))
        pressure = float(parameters.get('pressure', 1))
        time_step = float(parameters.get('timeStep', 0.002))
        total_steps = int(parameters.get('totalSteps', 1000000))
        
        # Simulate computation time
        time.sleep(5)  # Simulating some processing time
        
        # Generate mock results with more realistic random generation
        statistics = {
            'mean_energy': np.random.normal(150, 25),  # More realistic normal distribution
            'total_energy': np.random.normal(1500, 100),
            'temperature_avg': temperature,
            'pressure_avg': pressure
        }
        
        convergence_metrics = {
            'energy_convergence': np.clip(np.random.normal(0.9, 0.05), 0, 1),
            'structure_rmsd': np.abs(np.random.normal(0.3, 0.1))
        }
        
        return {
            'statistics': {k: float(v) for k, v in statistics.items()},
            'convergence_metrics': {k: float(v) for k, v in convergence_metrics.items()},
            'simulation_time': total_steps * time_step,
            'trajectory_sample': {
                'frames': 100,
                'data_points': 1000
            },
            'system_info': {
                'python_version': platform.python_version(),
                'os': platform.system(),
                'os_version': platform.release()
            }
        }
    except Exception as e:
        print(f"Simulation error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise

def main():
    try:
        # Debug: Print Python executable and environment
        print(f"Python executable: {sys.executable}")
        print(f"Python version: {sys.version}")
        print(f"System PATH: {sys.path}")
        
        # Check if correct number of arguments
        if len(sys.argv) < 3:
            print("Usage: python dask_worker.py <simulation_id> '<simulation_data_json>'")
            sys.exit(1)
        
        simulation_id = sys.argv[1]
        simulation_data_json = sys.argv[2]
        
        # Parse simulation data with robust error handling
        try:
            simulation_data = json.loads(simulation_data_json)
        except json.JSONDecodeError:
            print(f"Invalid JSON: {simulation_data_json}")
            sys.exit(1)
        
        # Parse parameters with fallback
        parameters = simulation_data.get('parameters', {})
        simulation_type = simulation_data.get('type', 'molecular_dynamics')
        
        # Run appropriate simulation based on type
        if simulation_type == 'molecular_dynamics':
            results = molecular_dynamics_simulation(parameters)
        else:
            raise ValueError(f"Unsupported simulation type: {simulation_type}")
        
        # Add simulation ID to results for tracking
        results['simulation_id'] = simulation_id
        
        # Print results as JSON for parsing
        print(json.dumps(results))
        
    except Exception as e:
        error_details = {
            'error_message': str(e),
            'traceback': traceback.format_exc(),
            'simulation_id': simulation_id if 'simulation_id' in locals() else 'unknown',
            'system_info': {
                'python_version': platform.python_version(),
                'os': platform.system(),
                'os_version': platform.release()
            }
        }
        print(json.dumps(error_details))
        sys.exit(1)

if __name__ == "__main__":
    main()