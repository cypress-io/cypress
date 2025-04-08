import { Component, Input } from '@angular/core'

@Component({
  selector: 'errors-component',
  template: `<div>
  <button id="sync-error" (click)="syncError()">Sync Error</button>
  <button id="async-error" (click)="asyncError()">Sync Error</button>
  </div>`,
})
export class ErrorsComponent {
  @Input() throwError!: boolean

  syncError () {
    throw new Error('sync error')
  }

  asyncError () {
    setTimeout(() => {
      throw new Error('async error')
    })
  }
}
