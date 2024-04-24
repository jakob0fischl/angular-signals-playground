import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'multiple-signal-reads',
    loadComponent:
      () => import('../components/multiple-signal-reads/multiple-signal-reads.component')
        .then(i => i.MultipleSignalReadsComponent)
  }
];
