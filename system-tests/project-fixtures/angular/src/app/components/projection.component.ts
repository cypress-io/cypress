import { Component } from '@angular/core'

@Component({
  selector: 'app-projection',
  standalone: false,
  template: `<h3><ng-content></ng-content></h3>`,
})
export class ProjectionComponent {}
