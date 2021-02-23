import { observable, action } from 'mobx'

export interface VueEvent {
  uid: string
  name: string  
  payload: any
}

export class State {
  @observable events: VueEvent[] = []
  @observable instanceId?: number

  @action addEvent (event: VueEvent) {
    this.events = [...this.events, event]
  }

  @action clearEvents () {
    this.events = []
  }

  @action setInstanceId (id: number) {
    this.instanceId = id
  }
}
