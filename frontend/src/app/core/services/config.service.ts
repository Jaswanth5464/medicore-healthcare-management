import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly fallbackApiHost = 'medicore-api-jaswanth.us-east-1.elasticbeanstalk.com';

  private get runtimeOrigin(): string | null {
    if (typeof window === 'undefined') return null;

    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalhost && isDevMode()) {
      return 'http://localhost:5031';
    }

    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${this.fallbackApiHost}`;
  }

  get baseApiUrl(): string {
    return this.runtimeOrigin ?? `http://${this.fallbackApiHost}`;
  }

  get apiUrl(): string {
    return `${this.baseApiUrl}/api`;
  }
}
