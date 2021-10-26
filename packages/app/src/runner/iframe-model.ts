import type { MobxRunnerStore } from '../store'

export interface AutSnapshot {
  id?: number
  name?: string
  snapshot?: AutSnapshot
  snapshots?: AutSnapshot[]
  htmlAttrs: Record<string, any> // Type is NamedNodeMap, not sure if we should include lib: ["DOM"]
  viewportHeight: number
  viewportWidth: number
  url: string
  body: {
    get: () => unknown // TOOD: find out what this is, some sort of JQuery API.
  }
}

type Fn = () => void

export class IframeModel {
  isSnapshotPinned: boolean = false
  originalState?: AutSnapshot
  detachedId?: number
  intervalId?: number

  constructor (
    private state: MobxRunnerStore,
    private detachDom: () => AutSnapshot,
    private restoreDom: (snapshot: any) => void,
    private highlightEl: ({ body }: any, opts: any) => void,
    private eventManager: any,
    private snapshotControls: any,
    private MobX: any,
    private studio: {
      selectorPlaygroundModel: any
      recorder: any
    },
  ) {
    this._reset()
  }

  listen () {
    this.eventManager.on('run:start', this.MobX.action('run:start', this._beforeRun))
    this.eventManager.on('run:end', this.MobX.action('run:end', this._afterRun))

    this.eventManager.on('viewport:changed', this.MobX.action('viewport:changed', this._updateViewport))
    this.eventManager.on('config', this.MobX.action('config', (config: any) => {
      const { viewportWidth, viewportHeight } = config

      return this._updateViewport({ viewportHeight, viewportWidth })
    }))

    this.eventManager.on('url:changed', this.MobX.action('url:changed', this._updateUrl))
    this.eventManager.on('page:loading', this.MobX.action('page:loading', this._updateLoadingUrl))

    this.eventManager.on('show:snapshot', this.MobX.action('show:snapshot', this._setSnapshots))
    this.eventManager.on('hide:snapshot', this.MobX.action('hide:snapshot', this._clearSnapshots))

    this.eventManager.on('pin:snapshot', this.MobX.action('pin:snapshot', this._pinSnapshot))
    this.eventManager.on('unpin:snapshot', this.MobX.action('unpin:snapshot', this._unpinSnapshot))
  }

  _beforeRun = () => {
    this.state.isLoading = false
    this.state.isRunning = true
    this.state.resetUrl()
    this.studio.selectorPlaygroundModel.setEnabled(false)
    this._reset()
    this._clearMessage()
  }

  _afterRun = () => {
    this.state.isRunning = false
  }

  _updateViewport = ({ viewportWidth, viewportHeight }, cb?: Fn) => {
    this.state.updateDimensions(viewportWidth, viewportHeight)

    if (cb) {
      this.state.setViewportUpdatedCallback(cb)
    }
  }

  _updateUrl = (url: string) => {
    this.state.url = url
  }

  _updateLoadingUrl = (isLoadingUrl: boolean) => {
    this.state.isLoadingUrl = isLoadingUrl
  }

  _clearMessage = () => {
    this.state.clearMessage()
  }

  _setSnapshots = (snapshotProps: AutSnapshot) => {
    if (this.isSnapshotPinned) return

    if (this.state.isRunning) {
      return this._testsRunningError()
    }

    if (this.studio.recorder.isOpen) {
      return this._studioOpenError()
    }

    const { snapshots } = snapshotProps

    if (!snapshots || !snapshots.length) {
      this._clearSnapshots()
      this._setMissingSnapshotMessage()

      return
    }

    this.state.highlightUrl = true

    if (!this.originalState) {
      this._storeOriginalState()
    }

    this.detachedId = snapshotProps.id

    this._updateViewport(snapshotProps)
    this._updateUrl(snapshotProps.url)

    clearInterval(this.intervalId)

    const revert = this.MobX.action('revert:snapshot', this._showSnapshot)

    if (snapshots.length > 1) {
      let i = 0

      this.intervalId = window.setInterval(() => {
        if (this.isSnapshotPinned) return

        i += 1
        if (!snapshots[i]) {
          i = 0
        }

        revert(snapshots[i], snapshotProps)
      }, 800)
    }

    revert(snapshots[0], snapshotProps)
  }

  _showSnapshot = (snapshot, snapshotProps) => {
    this.state.messageTitle = 'DOM Snapshot'
    this.state.messageDescription = snapshot.name
    this.state.messageType = ''

    this._restoreDom(snapshot, snapshotProps)
  }

  _restoreDom (snapshot, snapshotProps) {
    this.restoreDom(snapshot)

    if (snapshotProps.$el) {
      this.highlightEl(snapshot, snapshotProps)
    }
  }

  _clearSnapshots = () => {
    if (this.isSnapshotPinned) return

    clearInterval(this.intervalId)

    this.state.highlightUrl = false

    if (!this.originalState || !this.originalState.body) {
      return this._clearMessage()
    }

    const previousDetachedId = this.detachedId

    // process on next tick so we don't restore the dom if we're
    // about to receive another 'show:snapshot' event, else that would
    // be a huge waste
    setTimeout(this.MobX.action('clear:snapshots:next:tick', () => {
      if (!this.originalState) {
        return
      }

      // we want to only restore the dom if we haven't received
      // another snapshot by the time this function runs
      if (previousDetachedId !== this.detachedId) return

      this._updateViewport(this.originalState)
      this._updateUrl(this.originalState.url)
      this.restoreDom(this.originalState.snapshot)
      this._clearMessage()

      this.originalState = undefined
      this.detachedId = undefined
    }))
  }

  _pinSnapshot = (snapshotProps) => {
    const { snapshots } = snapshotProps

    if (!snapshots || !snapshots.length) {
      this.eventManager.snapshotUnpinned()
      this._setMissingSnapshotMessage()

      return
    }

    clearInterval(this.intervalId)

    this.isSnapshotPinned = true

    this.state.snapshot = {
      showingHighlights: true,
      stateIndex: 0,
    }

    this.state.messageTitle = 'DOM Snapshot'
    this.state.messageDescription = 'pinned'
    this.state.messageType = 'info'
    this.state.messageControls = window.UnifiedRunner.MobX.runInAction(() => {
      return this.snapshotControls(snapshotProps)
    })

    this._restoreDom(snapshots[0], snapshotProps)
  }

  _setMissingSnapshotMessage () {
    this.state.messageTitle = 'The snapshot is missing. Displaying current state of the DOM.'
    this.state.messageDescription = undefined
    this.state.messageType = 'warning'
  }

  _unpinSnapshot = () => {
    this.isSnapshotPinned = false
    this.state.messageTitle = 'DOM Snapshot'
    this.state.messageDescription = undefined
    this.state.messageControls = null
  }

  _testsRunningError () {
    this.state.messageTitle = 'Cannot show Snapshot while tests are running'
    this.state.messageType = 'warning'
  }

  _studioOpenError () {
    this.state.messageTitle = 'Cannot show Snapshot while creating commands in Studio'
    this.state.messageType = 'warning'
  }

  _storeOriginalState () {
    const finalSnapshot = this.detachDom()

    if (!finalSnapshot) return

    const { body, htmlAttrs } = finalSnapshot

    this.originalState = {
      body,
      htmlAttrs,
      snapshot: finalSnapshot,
      url: this.state.url,
      // TODO: use same attr for both runner and runner-ct states.
      // these refer to the same thing - the viewport dimensions.
      viewportWidth: this.state.width,
      viewportHeight: this.state.height,
    }
  }

  _reset () {
    this.detachedId = undefined
    this.intervalId = undefined
    this.originalState = undefined
    this.isSnapshotPinned = false
  }
}
