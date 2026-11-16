import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core'

@Component({
  selector: 'signals-required-component',
  templateUrl: './signals-required.component.html',
  styleUrls: ['./signals-required.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsRequiredComponent {
  title = input.required<string>()
  count = model.required<number>()
}
