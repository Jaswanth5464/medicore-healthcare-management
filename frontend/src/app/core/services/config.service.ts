import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Base URL pointing to the live AWS Elastic Beanstalk API
  private readonly baseUrl = 'http://medicore-api-jaswanth.us-east-1.elasticbeanstalk.com';

  get apiUrl(): string {
    return `${this.baseApiUrl}/api`;
  }

  get baseApiUrl(): string {
    if (typeof window !== 'undefined') {
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocalhost && isDevMode()) {
        return 'http://localhost:5031';
      }
    }

    return this.baseUrl;
  }
}
