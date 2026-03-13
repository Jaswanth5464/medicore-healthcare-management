import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-root">
      <div class="not-found-container">
        <div class="error-code">404</div>
        
        <div class="error-content">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          
          <div class="error-illustration">
            <svg viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="90" stroke="currentColor" stroke-width="2" opacity="0.2"/>
              <circle cx="70" cy="80" r="8" fill="currentColor"/>
              <circle cx="130" cy="80" r="8" fill="currentColor"/>
              <path d="M75 120 Q100 135 125 120" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <div class="action-buttons">
          <a routerLink="/auth/login" class="btn btn-primary">
            Back to Login
          </a>
          <a routerLink="/dashboard" class="btn btn-secondary">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-root {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .not-found-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      padding: 60px 40px;
      text-align: center;
      max-width: 500px;
      width: 100%;
    }

    .error-code {
      font-size: 120px;
      font-weight: 900;
      color: transparent;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      margin: 0;
      line-height: 1;
    }

    .error-content {
      margin-top: 20px;
      margin-bottom: 40px;
    }

    .error-content h1 {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin: 20px 0 10px 0;
    }

    .error-content p {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .error-illustration {
      margin: 30px 0;
      color: #667eea;
      opacity: 0.6;
    }

    .error-illustration svg {
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-direction: column;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
      transform: translateY(-2px);
    }

    @media (max-width: 600px) {
      .not-found-container {
        padding: 40px 20px;
      }

      .error-code {
        font-size: 80px;
      }

      .error-content h1 {
        font-size: 24px;
      }
    }
  `]
})
export class NotFoundComponent {}
