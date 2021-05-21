import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-output-subscribe',
  templateUrl: './output-subscribe.component.html',
})
export class OutputSubscribeComponent {
  @Output() counterClick = new EventEmitter<number>()
  counter = 0

  onClick() {
    this.counter++
    this.counterClick.emit(this.counter)
  }
}
