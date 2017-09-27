import { action, computed, observable } from 'mobx'
import localData from '../lib/local-data'

class AppStore {
  @observable env
  @observable os
  @observable projectPath = null
  @observable newVersion
  @observable version
  @observable localInstallNoticeDismissed = localData.get('local-install-notice-dimissed')
  @observable error

  @computed get displayVersion () {
    return this.isDev ? `${this.version} (dev)` : this.version
  }

  @computed get isDev () {
    return this.env === 'development'
  }

  @computed get isGlobalMode () {
    return !this.projectPath
  }

  @computed get updateAvailable () {
    return this.version !== this.newVersion
  }

  @action set (props) {
    if (props.env != null) this.env = props.env
    if (props.os != null) this.os = props.os
    if (props.projectPath != null) this.projectPath = props.projectPath
    if (props.version != null) this.version = this.newVersion = props.version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }

  @action setLocalInstallNoticeDismissed (isDismissed) {
    this.localInstallNoticeDismissed = isDismissed
    localData.set('local-install-notice-dimissed', isDismissed)
  }

  @action setError (err) {
    this.error = err
  }
}

export default new AppStore()
