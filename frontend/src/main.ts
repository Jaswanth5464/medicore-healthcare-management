import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

if (typeof window !== 'undefined') {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalhost && window.location.protocol === 'http:') {
    const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(httpsUrl);
  }
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
