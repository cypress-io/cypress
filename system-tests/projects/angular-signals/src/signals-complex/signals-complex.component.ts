import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core'
import { NgFor, NgIf } from '@angular/common'

export type User = {
  firstName: string
  lastName: string
  age: number
}

@Component({
  selector: 'signals-complex-component',
  templateUrl: './signals-complex.component.html',
  styleUrls: ['./signals-complex.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsComplexComponent {
  user = input.required<User>()
  acquaintances = model.required<User[]>()
}
