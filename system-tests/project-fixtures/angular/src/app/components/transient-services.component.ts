import { Component, Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class TransientService {
  get message () {
    return 'Original Transient Service'
  }
}

@Injectable({ providedIn: 'root' })
class DirectService {
  constructor (private transientService: TransientService) {
  }

  get message () {
    return this.transientService.message
  }
}

@Component({
  template: `<p>{{directService.message}}</p>`,
})
export class TransientServicesComponent {
  constructor (public directService: DirectService) {}
}
