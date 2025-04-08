import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  signal,
} from '@angular/core'

@Component({
  selector: 'signals-optional-component',
  templateUrl: './signals-optional.component.html',
  styleUrls: ['./signals-optional.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsOptionalComponent {
  title = input('Default Title')
  count = model(0)
  // used to make sure we don't blow this away when merging CT props
  $setSignal = signal(3)
}
