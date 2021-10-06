import { Component, OnInit, Input } from '@angular/core'

@Component({
  selector: 'app-html-mount',
  templateUrl: './html-mount.component.html',
})
export class HtmlMountComponent implements OnInit {
  @Input() data = '';

  ngOnInit (): void {}
}
