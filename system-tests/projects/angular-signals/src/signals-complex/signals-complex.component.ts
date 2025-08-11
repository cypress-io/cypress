import {
  ChangeDetectionStrategy,
  Component,
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
}
