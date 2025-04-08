import { Component } from '@angular/core'
import { CounterService } from './counter.service'

@Component({
  selector: 'counter-component',
  standalone: false,
  template: `<button (click)="increment()">
    Increment: {{ count$ | async }}
  </button>`,
})
export class CounterComponent {
  count$ = this.counterService.count$

  constructor (private counterService: CounterService) {}

  increment () {
    this.counterService.increment()
  }
}
