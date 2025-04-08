import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable()
export class CounterService {
  private count = new BehaviorSubject<number>(0)
  public count$ = this.count.asObservable()

  public increment () {
    this.count.next(this.count.value + 1)
  }
}
