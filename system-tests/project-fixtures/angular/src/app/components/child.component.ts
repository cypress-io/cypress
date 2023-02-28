import { Component, Input } from '@angular/core'

@Component({
  selector: 'child-component',
  template: '<h1>{{msg}}</h1>',
})
export class ChildComponent {
  @Input() msg!: string;
}
