import { action, computed, observable } from 'mobx'
import localData from '../lib/local-data'

class UpdateStore {
  // states
  LOADING_RELEASE_NOTES = 'LOADING_RELEASE_NOTES'
  SHOW_RELEASE_NOTES = 'SHOW_RELEASE_NOTES'
  SHOW_INSTRUCTIONS = 'SHOW_INSTRUCTIONS'

  @observable version
  @observable newVersion
  @observable dismissedUpdateVersion = localData.get('dismissed-update-version')
  @observable state
  @observable.ref releaseNotes

  constructor () {
    if (window.Cypress) {
      window.UpdateStore = this // for testing
    }
  }

  @computed get updateAvailable () {
    return this.version !== this.newVersion
  }

  @computed get nonDismissedUpdateAvailable () {
    return this.updateAvailable && this.newVersion !== this.dismissedUpdateVersion
  }

  @computed get hasMatchingReleaseNotes () {
    return this.releaseNotes && this.releaseNotes.version === this.newVersion
  }

  @action setVersion (version) {
    if (version != null) this.version = this.newVersion = version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }

  @action setDismissedUpdateVersion () {
    this.dismissedUpdateVersion = this.newVersion
    localData.set('dismissed-update-version', this.newVersion)
  }

  @action setReleaseNotes (releaseNotes) {
    this.releaseNotes = releaseNotes
  }

  @action setState (state) {
    this.state = state
  }
}

export default new UpdateStore()
