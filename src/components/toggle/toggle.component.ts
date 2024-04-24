import {ChangeDetectionStrategy, Component, model} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [
    FormsModule,
  ],
  templateUrl: './toggle.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent {
  public readonly checked = model.required<boolean>();
}
