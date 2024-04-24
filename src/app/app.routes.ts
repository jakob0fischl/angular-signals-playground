import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'signals-vs-rxjs-performance',
    loadComponent:
      () => import('../components/signals-vs-rxjs-performance/signal-vs-rxjs-performance.component')
        .then(i => i.SignalVsRxjsPerformanceComponent)
  }
];
