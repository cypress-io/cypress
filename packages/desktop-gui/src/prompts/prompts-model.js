import _ from 'lodash'
import { action, extendObservable } from 'mobx'
import interval from 'human-interval'

const prompts = [{
  slug: 'ci1',
  interval: interval('4 days'),
  noProjectId: true,
}, {
  slug: 'dashboard1',
  interval: interval('7 days'),
  noProjectId: true,
}]

export default class Prompts {
  promptsShown
  hasProjectId

  constructor () {
    this._initialize()
  }

  _initialize = () => {
    const props = {}

    _.each(prompts, (prompt) => {
      props[this._promptPropName(prompt.slug)] = false
    })

    extendObservable(this, props)
  }

  _promptPropName = (slug) => {
    return `${slug}PromptOpen`
  }

  isPromptOpen = (slug) => {
    return this[this._promptPropName(slug)]
  }

  @action openPrompt = (slug) => {
    this[this._promptPropName(slug)] = true
  }

  @action closePrompt = (slug) => {
    this[this._promptPropName(slug)] = true
  }

  @action setPromptStates = (config) => {
    const { state, projectId } = config

    this.firstOpened = state.firstOpened
    this.lastOpened = state.lastOpened
    this.promptsShown = state.promptsShown
    this.hasProjectId = !!projectId

    // do not show any prompts if another has been shown recently
    if (this._promptShownRecently()) return

    for (const prompt of prompts) {
      if (this._shouldShowPrompt(prompt)) {
        this.openPrompt(prompt.slug)

        // only show one prompt at a time
        return
      }
    }
  }

  _promptShownRecently = () => {
    if (!this.promptsShown) return false

    const delay = interval('1 day')
    const now = Date.now()

    return !!_.find(this.promptsShown, (timeShown) => {
      return now - timeShown < delay
    })
  }

  _shouldShowPrompt = (prompt) => {
    const timeSinceOpened = Date.now() - this.firstOpened

    // prompt has not been shown
    if (this.promptsShown && this.promptsShown[prompt.slug]) {
      return false
    }

    // enough time has passed
    if (timeSinceOpened < prompt.interval) {
      return false
    }

    // if prompt requires no project id,
    // check if project id exists
    if (prompt.noProjectId && this.hasProjectId) {
      return false
    }

    return true
  }
}
