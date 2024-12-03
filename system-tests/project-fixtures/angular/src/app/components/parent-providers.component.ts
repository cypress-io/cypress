import { Component } from '@angular/core'

@Component({
  standalone: false,
  template: `
    <app-child-providers></app-child-providers>
    <app-another-child></app-another-child>`,
})
export class ParentProvidersComponent {}
