import { Component, Input } from '@angular/core'

@Component({
  selector: 'child-component',
  standalone: false,
  template: '<h1>{{msg}}</h1>',
})
export class ChildComponent {
  @Input() msg!: string
}
