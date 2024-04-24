import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-multiple-signal-reads',
  standalone: true,
  imports: [],
  templateUrl: './multiple-signal-reads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block flex-1',
  },
})
export class MultipleSignalReadsComponent {

}
