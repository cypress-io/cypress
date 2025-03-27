import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core'

@Component({
  selector: 'app-lifecycle',
  standalone: false,
  template: `<p>Hi {{ name }}. ngOnInit fired: {{ ngOnInitFired }} and ngOnChanges fired: {{ ngOnChangesFired }} and conditionalName: {{ conditionalName }}</p>`,
})
export class LifecycleComponent implements OnInit, OnChanges {
  @Input() name = ''
  ngOnInitFired = false
  ngOnChangesFired = false
  conditionalName = false

  ngOnInit (): void {
    this.ngOnInitFired = true
  }

  ngOnChanges (changes: SimpleChanges): void {
    this.ngOnChangesFired = true
    if (changes['name'].currentValue === 'CONDITIONAL NAME') {
      this.conditionalName = true
    }
  }
}
