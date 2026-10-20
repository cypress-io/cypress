import { Component, signal } from '@angular/core'
import { ChildProvidersService } from './child-providers.service'

@Component({
  selector: 'app-child-providers',
  standalone: false,
  template: `<button (click)="handleClick()">{{ message() }}</button>`,
})
export class ChildProvidersComponent {
  message = signal('default message')

  constructor (private readonly service: ChildProvidersService) {}

  async handleClick (): Promise<void> {
    const message = await this.service.getMessage()

    this.message.set(message)
  }
}
