import { Component } from '@angular/core'

@Component({
  standalone: false,
  // declare components in the template
  template: `
    <app-child-providers></app-child-providers>
    <app-another-child></app-another-child>`,
})
export class ParentProvidersComponent {}
