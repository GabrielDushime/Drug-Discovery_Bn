
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string; 
  };
}
