import { Component } from '@angular/core'

@Component({
  selector: 'parent-component',
  template: '<child-component [msg]="msg"></child-component>',
})
export class ParentComponent {
  msg = 'Hello World from ParentComponent';
}
