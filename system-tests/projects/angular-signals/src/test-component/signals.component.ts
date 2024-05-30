import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core'

@Component({
  selector: 'signals-component',
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsComponent {
  title = input.required<string>()
  count = model.required<number>()
  updateCount () {
    this.count.update((count) => count + 1)
  }
}
