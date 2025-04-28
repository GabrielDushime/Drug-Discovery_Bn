import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class WelcomeController {
  @Get()
  getWelcome(@Res() res: Response) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Drug Discovery Platform</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .welcome-container {
              text-align: center;
              padding: 40px;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 800px;
            }
            h1 {
              color: #2c3e50;
            }
            p {
              color: #7f8c8d;
              margin-bottom: 20px;
            }
            .links {
              margin-top: 30px;
            }
            .link-item {
              margin-bottom: 15px;
            }
            a {
              color: #3498db;
              text-decoration: none;
              font-weight: bold;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="welcome-container">
            <h1>Welcome to Scientific Computing for Drug Discovery!</h1>
            <p>API server is running successfully.</p>
            
            <div class="links">
              <div class="link-item">
                <p><strong>API Documentation:</strong> <a href="https://drug-discovery-bn.onrender.com/api/docs" target="_blank">Access Swagger Documentation</a></p>
              </div>
              <div class="link-item">
                <p><strong>Application:</strong> <a href="https://drug-discovery-apps.netlify.app/" target="_blank">Access Our Application on Netlify</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  @Get('swagger')
  getSwagger(): string {
    return 'Use This Link to access Swagger Documentation: https://drug-discovery-bn.onrender.com/api/docs';
  }

  @Get('netlify')
  getNetlify(): string {
    return 'Use This Link to access Our Application Service Deployed on Netlify:https://drug-discovery-apps.netlify.app/';
  }
}