import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-standalone',
  template: `<h1>Hello {{ name }}</h1>`,
})
export class StandaloneComponent {
  @Input() name!: string
}
