import { Component, signal } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-signals',
  template: `<span>{{ count() }}</span> <button (click)="increment()">+</button>`,
})
export class SignalsComponent {
  count = signal(0)

  increment (): void {
    this.count.update((_count: number) => _count + 1)
  }
}
