import { Component, signal } from '@angular/core'

@Component({
  selector: 'app-root',
  template: '<h1>{{title()}}</h1>',
  styles: [`
    h1 {
      background-color: blue;
      color: white
    }`],
})
export class App {
  protected readonly title = signal('Hello World!')
}
