import { Component } from '@angular/core'

@Component({
  selector: 'app-root',
  template: '<h1>{{message}}</h1>',
  styles: [`
    h1 {
      background-color: blue;
      color: white
    }`],
})
export class AppComponent {
  message = 'Hello World!'
}
