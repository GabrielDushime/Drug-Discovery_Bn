import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ModelFormat } from './entities/molecular-model.entity';
import { exec } from 'child_process';

@Injectable()
export class MolecularValidationService {
  private readonly logger = new Logger(MolecularValidationService.name);

  async validateMolecularModel(filePath: string, format: ModelFormat): Promise<{ isValid: boolean; results: any }> {
    try {
    
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      
      switch (format) {
        case ModelFormat.PDB:
          return this.validatePDB(fileContent);
        case ModelFormat.MOL2:
          return this.validateMOL2(fileContent);
        case ModelFormat.SDF:
          return this.validateSDF(fileContent);
        default:
          return { isValid: false, results: { error: 'Unsupported file format' } };
      }
    } catch (error) {
      this.logger.error(`Error validating molecular model: ${error.message}`);
      return { 
        isValid: false, 
        results: { error: `File validation failed: ${error.message}` } 
      };
    }
  }
  
  async validatePDBUsingPython(filePath: string): Promise<{ isValid: boolean; results: any }> {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../scripts/molecular_validation.py');
        exec(`python ${scriptPath} ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                this.logger.error(`BioPython validation failed: ${stderr}`);
                return reject({ isValid: false, error: "Validation failed" });
            }
            resolve(JSON.parse(stdout));
        });
    });
}

  private validatePDB(content: string): { isValid: boolean; results: any } {
   
    const hasAtomRecords = content.includes('ATOM') || content.includes('HETATM');
    
    if (!hasAtomRecords) {
      return {
        isValid: false,
        results: {
          error: 'Invalid PDB file: No ATOM or HETATM records found',
          suggestions: 'Check if the file is correctly formatted according to PDB standards'
        }
      };
    }
    
   
    const atomLines = content.split('\n').filter(line => 
      line.startsWith('ATOM') || line.startsWith('HETATM')
    );
    
    return {
      isValid: true,
      results: {
        atomCount: atomLines.length,
        message: 'PDB file is valid',
        warnings: [] 
      }
    };
  }

  private validateMOL2(content: string): { isValid: boolean; results: any } {
    
    const hasMoleculeSection = content.includes('@<TRIPOS>MOLECULE');
    const hasAtomSection = content.includes('@<TRIPOS>ATOM');
    const hasBondSection = content.includes('@<TRIPOS>BOND');
    
    if (!hasMoleculeSection || !hasAtomSection || !hasBondSection) {
      return {
        isValid: false,
        results: {
          error: 'Invalid MOL2 file: Missing required sections',
          missingMolecule: !hasMoleculeSection,
          missingAtoms: !hasAtomSection,
          missingBonds: !hasBondSection,
          suggestions: 'Ensure the file has @<TRIPOS>MOLECULE, @<TRIPOS>ATOM, and @<TRIPOS>BOND sections'
        }
      };
    }
    
 
    const lines = content.split('\n');
    let atomCount = 0;
    let bondCount = 0;
    
   
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('@<TRIPOS>MOLECULE')) {
       
        if (i + 2 < lines.length) {
          const countLine = lines[i + 2].trim().split(/\s+/);
          if (countLine.length >= 2) {
            atomCount = parseInt(countLine[0]);
            bondCount = parseInt(countLine[1]);
            break;
          }
        }
      }
    }
    
    return {
      isValid: true,
      results: {
        atomCount,
        bondCount,
        message: 'MOL2 file is valid',
      }
    };
  }

  private validateSDF(content: string): { isValid: boolean; results: any } {
   
    const lines = content.split('\n');
    
    if (lines.length < 4) {
      return {
        isValid: false,
        results: {
          error: 'Invalid SDF file: File too short',
          suggestions: 'Ensure the file follows SDF format standards'
        }
      };
    }
    
 
    const countsLine = lines[3].trim();
    if (countsLine.length < 6) {
      return {
        isValid: false,
        results: {
          error: 'Invalid SDF file: Invalid counts line',
          suggestions: 'The fourth line should contain atom and bond counts'
        }
      };
    }
    
   
    const atomCount = parseInt(countsLine.substring(0, 3).trim());
    const bondCount = parseInt(countsLine.substring(3, 6).trim());
    
    if (isNaN(atomCount) || isNaN(bondCount)) {
      return {
        isValid: false,
        results: {
          error: 'Invalid SDF file: Cannot parse atom or bond counts',
          suggestions: 'Check if the counts line is correctly formatted'
        }
      };
    }
    
   
    if (lines.length < 4 + atomCount + bondCount) {
      return {
        isValid: false,
        results: {
          error: 'Invalid SDF file: Not enough data for declared atoms and bonds',
          suggestions: 'Ensure the file contains all atom and bond entries'
        }
      };
    }
    
    return {
      isValid: true,
      results: {
        atomCount,
        bondCount,
        message: 'SDF file is valid',
      }
    };
  }
}