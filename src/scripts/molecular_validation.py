from Bio import PDB
import sys
import json

def validate_pdb(file_path):
    parser = PDB.PDBParser(QUIET=True)
    
    try:
        structure = parser.get_structure("model", file_path)
        
       
        missing_chains = []
        missing_residues = []
        atom_count = 0
        
        for model in structure:
            for chain in model:
                if not chain.id:
                    missing_chains.append(chain.id)
                for residue in chain:
                    if not residue.id:
                        missing_residues.append(residue.id)
                    atom_count += len(residue)
        
        validation_result = {
            "isValid": True if atom_count > 0 else False,
            "atomCount": atom_count,
            "missingChains": missing_chains,
            "missingResidues": missing_residues,
            "message": "PDB file is valid" if atom_count > 0 else "PDB file is empty",
        }
        
        print(json.dumps(validation_result))
    
    except Exception as e:
        print(json.dumps({"isValid": False, "error": str(e)}))

if __name__ == "__main__":
    validate_pdb(sys.argv[1])
