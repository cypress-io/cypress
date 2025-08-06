import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
} from '@angular/core'
import { AsyncPipe, NgFor, NgIf } from '@angular/common'
import { toObservable } from '@angular/core/rxjs-interop'
import { combineLatest, distinctUntilChanged, map } from 'rxjs'

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
  imports: [NgFor, NgIf, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsComplexComponent {
  user = input.required<User>()
  acquaintances = model.required<User[]>()

  readonly firstName$ = toObservable(this.user).pipe(
    map((user) => user.firstName),
    distinctUntilChanged(),
  )
  readonly lastName$ = toObservable(this.user).pipe(
    map((user) => user.lastName),
    distinctUntilChanged(),
  )
  readonly initials$ = combineLatest([
    this.firstName$, this.lastName$,
  ]).pipe(
    map(([firstName, lastName]) => firstName.charAt(0) + lastName.charAt(0)),
  )

  constructor () {
    effect(() => {
      // there is a bug in Angular 17 that doesn't rerender the signal when set outside the component context
      // this is resolved in Angular 18. adding an effect() causes the template to be update when the signal is updated
      console.log(`The user is: ${JSON.stringify(this.user())}`)
      console.log(`The acquaintances are: ${JSON.stringify(this.acquaintances())}`)
    })
  }
}
