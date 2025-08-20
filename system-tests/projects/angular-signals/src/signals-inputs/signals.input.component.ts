import { Component, EventEmitter, Output, output } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'signals-input-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signals.input.component.html',
})
export class SignalsInputComponent {
  newOutput = output()
  @Output() oldOutput: EventEmitter<void> = new EventEmitter()

  onButtonClick () {
    this.newOutput.emit()
    this.oldOutput.emit()
  }
}
