import { Component, Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class MessageService {
  get message () {
    return 'globally provided service'
  }
}

@Component({
  template: `<p>{{messageService.message}}</p>`,
  providers: [{
    provide: MessageService,
    useValue: { message: 'component provided service' },
  }],
})
export class ComponentProviderComponent {
  constructor (public messageService: MessageService) {
  }
}
