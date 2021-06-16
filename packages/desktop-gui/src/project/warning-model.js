import { action, computed, observable, makeObservable } from 'mobx'

class Warning {
  type;
  message;
  isDismissed = false;
  isRetrying = false;

  constructor (props) {
    makeObservable(this, {
      type: observable,
      message: observable,
      isDismissed: observable,
      isRetrying: observable,
      isRetryable: computed,
      setDismissed: action,
      setRetrying: action,
    })

    this.type = props.type
    this.message = props.message
  }

  get isRetryable () {
    return this.type === 'CANNOT_CONNECT_BASE_URL_WARNING'
  }

  setDismissed (isDismissed) {
    this.isDismissed = isDismissed
  }

  setRetrying (isRetrying) {
    this.isRetrying = isRetrying
  }
}

export default Warning
