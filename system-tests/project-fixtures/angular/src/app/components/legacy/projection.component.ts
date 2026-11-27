import { Component } from '@angular/core'

@Component({
  selector: 'app-projection',
  template: `<h3><ng-content></ng-content></h3>`,
  standalone: false,
})
export class ProjectionComponent {}
