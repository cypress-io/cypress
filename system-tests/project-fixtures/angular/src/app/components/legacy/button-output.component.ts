import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-button-output',
  standalone: false,
  template: `<button (click)="clicked.emit(true)">Click Me</button>`,
})
export class ButtonOutputComponent {
  // Used to test legacy @Output() decorators
  @Output() clicked: EventEmitter<boolean> = new EventEmitter()
}
