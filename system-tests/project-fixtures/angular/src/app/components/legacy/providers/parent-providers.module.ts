import { NgModule } from '@angular/core'
import { ChildProvidersComponent } from './child-providers.component'
import { AnotherChildProvidersComponent } from './another-child-providers.component'
import { ParentProvidersComponent } from './parent-providers.component'

@NgModule({
  declarations: [ParentProvidersComponent, ChildProvidersComponent, AnotherChildProvidersComponent],
})
export class ParentProvidersModule { }
