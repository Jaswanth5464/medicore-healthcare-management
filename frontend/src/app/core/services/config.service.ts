import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Base URL pointing to the live AWS Elastic Beanstalk API
  private readonly baseUrl = 'http://medicore-api-jaswanth.us-east-1.elasticbeanstalk.com';

  get apiUrl(): string {
    return `${this.baseUrl}/api`;
  }

  get baseApiUrl(): string {
    return this.baseUrl;
  }
}
