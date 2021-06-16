import { action, computed, observable, makeObservable } from 'mobx'
import localData from '../lib/local-data'
import updateStore from '../update/update-store'

class AppStore {
  cypressEnv;
  os;
  projectRoot = null;
  localInstallNoticeDismissed = localData.get('local-install-notice-dimissed');
  error;
  proxyServer;
  proxyBypassList;
  proxySource;

  constructor () {
    makeObservable(this, {
      cypressEnv: observable,
      os: observable,
      projectRoot: observable,
      localInstallNoticeDismissed: observable,
      error: observable,
      proxyServer: observable,
      proxyBypassList: observable,
      proxySource: observable,
      displayVersion: computed,
      isDev: computed,
      isGlobalMode: computed,
      set: action,
      setLocalInstallNoticeDismissed: action,
      setError: action,
    })

    if (window.Cypress) {
      window.AppStore = this // for testing
    }
  }

  get displayVersion () {
    return this.isDev ? `${updateStore.version} (dev)` : updateStore.version
  }

  get isDev () {
    return this.cypressEnv === 'development'
  }

  get isGlobalMode () {
    return !this.projectRoot
  }

  set (props) {
    if (props.cypressEnv != null) this.cypressEnv = props.cypressEnv

    if (props.os != null) this.os = props.os

    if (props.projectRoot != null) this.projectRoot = props.projectRoot

    this.proxyServer = props.proxyServer || this.proxyServer
    this.proxyBypassList = props.proxyBypassList || this.proxyBypassList
    this.proxySource = props.proxySource || this.proxySource
  }

  setLocalInstallNoticeDismissed (isDismissed) {
    this.localInstallNoticeDismissed = isDismissed
    localData.set('local-install-notice-dimissed', isDismissed)
  }

  setError (err) {
    this.error = err
  }
}

export default new AppStore()
