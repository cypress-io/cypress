import { Component } from '@angular/core'

@Component({
  selector: 'app-timeout',
  templateUrl: './timeout.component.html',
})
export class TimeoutComponent {
  showMsg = false;

  submit () {
    this.showMsg = true
    setTimeout(() => (this.showMsg = false), 20000)
  }
}
