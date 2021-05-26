import { action, computed, observable } from 'mobx'

class Warning {
  @observable type
  @observable message
  @observable isDismissed = false
  @observable isRetrying = false

  constructor (props) {
    this.type = props.type
    this.message = props.message
  }

  @computed get isRetryable () {
    return this.type === 'CANNOT_CONNECT_BASE_URL_WARNING'
  }

  @action setDismissed (isDismissed) {
    this.isDismissed = isDismissed
  }

  @action setRetrying (isRetrying) {
    this.isRetrying = isRetrying
  }
}

export default Warning
