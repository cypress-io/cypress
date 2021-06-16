import _ from 'lodash'
import { action, computed, observable, extendObservable, makeObservable } from 'mobx'
import interval from 'human-interval'

const prompts = _.sortBy([
  {
    slug: 'ci1',
    interval: interval('4 days'),
    noProjectId: true,
  },
  {
    slug: 'orchestration1',
    noProjectId: true,
  },
], 'interval')

export default class Prompts {
  _automaticOpen = false;
  _promptsShown
  _hasProjectId

  constructor () {
    makeObservable(this, {
      _automaticOpen: observable,
      anyOpen: computed,
      utm_content: computed,
      openPrompt: action,
      closePrompt: action,
      setPromptStates: action,
    })

    this._initialize()
  }

  _initialize = () => {
    const props = {}

    _.each(prompts, ({ slug }) => {
      props[slug] = false
    })

    extendObservable(this, props)
  }

  get anyOpen () {
    return !!_.find(prompts, ({ slug }) => this[slug])
  }

  get utm_content () {
    return this._automaticOpen ? 'Automatic' : 'Manual'
  }

  openPrompt = (slug) => {
    this[slug] = true
    this._automaticOpen = false
  };

  closePrompt = (slug) => {
    this[slug] = false
    this._automaticOpen = false
  };

  setPromptStates = (config) => {
    const { state, projectId } = config

    // if no state (due to error) then no prompts are shown
    if (!state) return

    this.firstOpened = state.firstOpened
    this.lastOpened = state.lastOpened
    this._promptsShown = state.promptsShown
    this._hasProjectId = !!projectId

    // do not show any prompts if another has been shown recently
    if (this._promptShownRecently()) return

    for (const prompt of prompts) {
      if (this._shouldShowPrompt(prompt)) {
        this.openPrompt(prompt.slug)
        this._automaticOpen = true

        // only show one prompt at a time
        return
      }
    }
  };

  _promptShownRecently = () => {
    if (!this._promptsShown) return false

    const delay = interval('1 day')
    const now = Date.now()

    return !!_.find(this._promptsShown, (timeShown) => {
      return now - timeShown < delay
    })
  }

  _shouldShowPrompt = (prompt) => {
    const timeSinceOpened = Date.now() - this.firstOpened

    // prompt has been shown
    if (this._promptsShown && this._promptsShown[prompt.slug]) {
      return false
    }

    // enough time has passed
    // no interval indicates never being shown automatically
    if (!prompt.interval || timeSinceOpened < prompt.interval) {
      return false
    }

    // if prompt requires no project id,
    // check if project id exists
    if (prompt.noProjectId && this._hasProjectId) {
      return false
    }

    return true
  }
}
