import { action, computed, observable } from 'mobx'
import localData from '../lib/local-data'

class AppStore {
  @observable cypressEnv
  @observable os
  @observable projectRoot = null
  @observable newVersion
  @observable version
  @observable localInstallNoticeDismissed = localData.get('local-install-notice-dimissed')
  @observable error
  @observable proxyServer
  @observable proxyBypassList
  @observable proxySource

  @computed get displayVersion () {
    return this.isDev ? `${this.version} (dev)` : this.version
  }

  @computed get isDev () {
    return this.cypressEnv === 'development'
  }

  @computed get isGlobalMode () {
    return !this.projectRoot
  }

  @computed get updateAvailable () {
    return this.version !== this.newVersion
  }

  @action set (props) {
    if (props.cypressEnv != null) this.cypressEnv = props.cypressEnv

    if (props.os != null) this.os = props.os

    if (props.projectRoot != null) this.projectRoot = props.projectRoot

    if (props.version != null) this.version = this.newVersion = props.version

    this.proxyServer = props.proxyServer || this.proxyServer
    this.proxyBypassList = props.proxyBypassList || this.proxyBypassList
    this.proxySource = props.proxySource || this.proxySource
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
