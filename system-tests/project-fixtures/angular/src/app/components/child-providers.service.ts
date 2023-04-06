import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ChildProvidersService {
  constructor (private readonly http: HttpClient) {}

  getMessage (): Observable<string> {
    return this.http.get<{ message: string }>('https://myfakeapiurl.com/api/message').pipe(
      map((response) => response.message),
    )
  }
}
