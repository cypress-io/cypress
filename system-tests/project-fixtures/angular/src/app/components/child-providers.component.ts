import { Component } from '@angular/core'
import { ChildProvidersService } from './child-providers.service'
import { take } from 'rxjs/operators'

@Component({
  selector: 'app-child-providers',
  standalone: false,
  template: `<button (click)="handleClick()">{{ message }}</button>`,
})
export class ChildProvidersComponent {
  message = 'default message'

  constructor (private readonly service: ChildProvidersService) {}

  handleClick (): void {
    this.service.getMessage().pipe(
      take(1),
    ).subscribe((message) => this.message = message)
  }
}
