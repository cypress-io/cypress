import { Component } from '@angular/core'
import { ChildProvidersService } from './child-providers.service'
import { take } from 'rxjs/operators'

@Component({
  selector: 'app-another-child',
  template: `<button (click)="handleClick()">{{ message }}</button>`,
  providers: [ChildProvidersService],
})
export class AnotherChildProvidersComponent {
  message = 'default another child message'

  constructor (private readonly service: ChildProvidersService) {}

  handleClick (): void {
    this.service.getMessage().pipe(
      take(1),
    ).subscribe((message) => this.message = message)
  }
}
