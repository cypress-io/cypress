import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class MyValuesService {
  getValues (): string[] {
    return ['val1', 'val2']
  }

  getValuesObservable (): Observable<string[]> {
    return of(['val1Obs', 'val2Obs'])
  }
}
