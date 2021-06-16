import { action, computed, observable, makeObservable } from 'mobx'
import localData from '../lib/local-data'

class UpdateStore {
  // states
  LOADING_RELEASE_NOTES = 'LOADING_RELEASE_NOTES'
  SHOW_RELEASE_NOTES = 'SHOW_RELEASE_NOTES'
  SHOW_INSTRUCTIONS = 'SHOW_INSTRUCTIONS'

  version = undefined;
  newVersion = undefined;
  dismissedUpdateVersion = localData.get('dismissed-update-version');
  state = undefined;
  releaseNotes = undefined;

  constructor () {
    makeObservable(this, {
      version: observable,
      newVersion: observable,
      dismissedUpdateVersion: observable,
      state: observable,
      releaseNotes: observable.ref,
      updateAvailable: computed,
      nonDismissedUpdateAvailable: computed,
      hasMatchingReleaseNotes: computed,
      setVersion: action,
      setNewVersion: action,
      setDismissedUpdateVersion: action,
      setReleaseNotes: action,
      setState: action,
    })

    if (window.Cypress) {
      window.UpdateStore = this // for testing
    }
  }

  get updateAvailable () {
    return this.version !== this.newVersion
  }

  get nonDismissedUpdateAvailable () {
    return this.updateAvailable && this.newVersion !== this.dismissedUpdateVersion
  }

  get hasMatchingReleaseNotes () {
    return this.releaseNotes && this.releaseNotes.version === this.newVersion
  }

  setVersion (version) {
    if (version != null) this.version = this.newVersion = version
  }

  setNewVersion (newVersion) {
    this.newVersion = newVersion
  }

  setDismissedUpdateVersion () {
    this.dismissedUpdateVersion = this.newVersion
    localData.set('dismissed-update-version', this.newVersion)
  }

  setReleaseNotes (releaseNotes) {
    this.releaseNotes = releaseNotes
  }

  setState (state) {
    this.state = state
  }
}

export default new UpdateStore()
