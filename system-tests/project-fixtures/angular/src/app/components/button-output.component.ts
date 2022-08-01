import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  template: `<button (click)="clicked.emit(true)">Click Me</button>`
})
export class ButtonOutputComponent {
  @Output() clicked: EventEmitter<boolean> = new EventEmitter()
}