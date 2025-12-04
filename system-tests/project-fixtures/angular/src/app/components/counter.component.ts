import { Component, model } from '@angular/core'

@Component({
  selector: 'counter-component',
  standalone: false,
  template: `<button (click)="increment()">
    Increment: {{ count() }}
  </button>`,
})
export class CounterComponent {
  count = model<number>(0)

  increment () {
    this.count.set(this.count() + 1)
  }
}
