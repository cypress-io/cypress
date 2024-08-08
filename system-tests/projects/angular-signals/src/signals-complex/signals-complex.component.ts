import {
  ChangeDetectionStrategy,
  Component,
  effect,
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
  constructor () {
    effect(() => {
      // there is a bug in Angular 17 that doesn't rerender the signal when set outside the component context
      // this is resolved in Angular 18. adding an effect() causes the template to be update when the signal is updated
      console.log(`The user is: ${JSON.stringify(this.user())}`)
      console.log(`The acquaintances are: ${JSON.stringify(this.acquaintances())}`)
    })
  }
}
