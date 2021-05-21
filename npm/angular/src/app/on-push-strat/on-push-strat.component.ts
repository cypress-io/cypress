import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core'

@Component({
  selector: 'app-on-push-strat',
  template: '{{ data }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnPushStratComponent implements OnInit {
  @Input() data = ''

  ngOnInit(): void {}
}
