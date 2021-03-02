import { action, computed, observable } from 'mobx'
import localData from '../lib/local-data'
import updateStore from '../update/update-store'

class AppStore {
  @observable cypressEnv
  @observable os
  @observable projectRoot = null
  @observable localInstallNoticeDismissed = localData.get('local-install-notice-dimissed')
  @observable error
  @observable proxyServer
  @observable proxyBypassList
  @observable proxySource

  constructor () {
    if (window.Cypress) {
      window.AppStore = this // for testing
    }
  }

  @computed get displayVersion () {
    return this.isDev ? `${updateStore.version} (dev)` : updateStore.version
  }

  @computed get isDev () {
    return this.cypressEnv === 'development'
  }

  @computed get isGlobalMode () {
    return !this.projectRoot
  }

  @action set (props) {
    if (props.cypressEnv != null) this.cypressEnv = props.cypressEnv

    if (props.os != null) this.os = props.os

    if (props.projectRoot != null) this.projectRoot = props.projectRoot

    this.proxyServer = props.proxyServer || this.proxyServer
    this.proxyBypassList = props.proxyBypassList || this.proxyBypassList
    this.proxySource = props.proxySource || this.proxySource
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
