import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Injectable({ providedIn: 'root' })
export class NetworkService {
  constructor(private httpClient: HttpClient) {}

  getUsers() {
    return this.httpClient.get<any[]>('https://jsonplaceholder.cypress.io/users?_limit=3')
  }
}
