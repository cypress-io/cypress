import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class ChildProvidersService {
  async getMessage (): Promise<string> {
    const response = await fetch('https://myfakeapiurl.com/api/message')
    const data = await response.json()

    return data.message
  }
}
