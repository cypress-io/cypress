import { NgModule } from '@angular/core'
import { ParentComponent } from './parent.component'
import { ChildComponent } from './child.component'

// legacy modules, which are not default convention since Angular 19
@NgModule({
  declarations: [ParentComponent, ChildComponent],
}) export class ParentChildModule {}
