import { Component } from '@angular/core'

@Component({
  selector: 'with-directives-component',
  standalone: false,
  template: ` <button (click)="show = !show">Toggle Message</button>
    <ul *ngIf="show">
      <li *ngFor="let item of items">{{ item }}</li>
    </ul>`,
})
export class WithDirectivesComponent {
  show = true

  items = ['breakfast', 'lunch', 'dinner']
}
