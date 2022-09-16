import { Component } from '@angular/core'
import { of } from 'rxjs'
import { map } from 'rxjs/operators'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular';

  constructor() {
    of('about to explode').pipe(map((res) => {
      throw new Error('Who wants to see a browser freeze?')

      return res
    })).subscribe()
  }
}
