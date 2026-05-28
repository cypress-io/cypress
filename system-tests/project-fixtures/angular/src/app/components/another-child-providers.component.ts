import { Component, signal } from '@angular/core'
import { ChildProvidersService } from './child-providers.service'

@Component({
  selector: 'app-another-child',
  standalone: false,
  template: `<button (click)="handleClick()">{{ message() }}</button>`,
  providers: [ChildProvidersService],
})
export class AnotherChildProvidersComponent {
  message = signal('default another child message')

  constructor (private readonly service: ChildProvidersService) {}

  async handleClick (): Promise<void> {
    const message = await this.service.getMessage()

    this.message.set(message)
  }
}
