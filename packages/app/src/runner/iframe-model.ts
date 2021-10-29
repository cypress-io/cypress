import { useSnapshotStore } from '../spec/snapshot-store'
import { useAutStore } from '../store'

export interface AutSnapshot {
  id?: number
  name?: string
  $el?: any
  snapshot?: AutSnapshot
  snapshots: AutSnapshot[]
  highlightAttr?: string
  htmlAttrs: Record<string, any> // Type is NamedNodeMap, not sure if we should include lib: ["DOM"]
  viewportHeight: number
  viewportWidth: number
  url: string
  body: {
    get: () => unknown // TOOD: find out what this is, some sort of JQuery API.
  }
}

export class IframeModel {
  isSnapshotPinned: boolean = false
  originalState?: AutSnapshot
  detachedId?: number
  intervalId?: number

  constructor (
    private detachDom: () => AutSnapshot,
    private restoreDom: (snapshot: any) => void,
    private highlightEl: ({ body }: any, opts: any) => void,
    private eventManager: any,
    private studio: {
      selectorPlaygroundModel: any
      recorder: any
    },
  ) {
    this._reset()
  }

  listen () {
    this.eventManager.on('run:start', this._beforeRun)
    this.eventManager.on('run:end', this._afterRun)

    this.eventManager.on('viewport:changed', this._updateViewport)
    // TODO(lachlan): verify this is called, and if it actually needs to be.
    // in CT/E2E/unified, because `listen` is called **after** this $Cypress has been
    // created and this event has been emitted, so right now in production
    // I don't think this is actually doing anything.
    this.eventManager.on('config', (config: { viewportHeight: number, viewportWidth: number }) => {
      const { viewportWidth, viewportHeight } = config

      return this._updateViewport({ viewportHeight, viewportWidth })
    })

    const autStore = useAutStore()

    this.eventManager.on('url:changed', (url: string) => {
      autStore.updateUrl(url)
    })

    this.eventManager.on('page:loading', this._updateLoadingUrl)

    this.eventManager.on('show:snapshot', this.setSnapshots)
    this.eventManager.on('hide:snapshot', this._clearSnapshots)

    this.eventManager.on('pin:snapshot', this._pinSnapshot)
    this.eventManager.on('unpin:snapshot', this._unpinSnapshot)
  }

  _beforeRun = () => {
    const snapshotStore = useSnapshotStore()
    const autStore = useAutStore()

    autStore.setIsLoading(false)
    autStore.setIsRunning(true)
    autStore.resetUrl()

    this.studio.selectorPlaygroundModel.setEnabled(false)
    this._reset()
    snapshotStore.clearMessage()
  }

  _afterRun = () => {
    const autStore = useAutStore()

    autStore.setIsRunning(false)
  }

  _updateViewport = ({ viewportWidth, viewportHeight }, cb?: () => void) => {
    const autStore = useAutStore()

    autStore.updateDimensions(viewportWidth, viewportHeight)

    if (cb) {
      autStore.setViewportUpdatedCallback(cb)
    }
  }

  _updateLoadingUrl = (isLoadingUrl: boolean) => {
    const autStore = useAutStore()

    autStore.setIsLoadingUrl(isLoadingUrl)
  }

  setSnapshots = (snapshotProps: AutSnapshot) => {
    const snapshotStore = useSnapshotStore()
    const autStore = useAutStore()

    if (snapshotStore.isSnapshotPinned) {
      return
    }

    if (autStore.isRunning) {
      return snapshotStore.setTestsRunningError()
    }

    if (this.studio.recorder.isOpen) {
      return this._studioOpenError()
    }

    const { snapshots } = snapshotProps

    if (!snapshots || !snapshots.length) {
      this._clearSnapshots()
      snapshotStore.setMissingSnapshotMessage()

      return
    }

    autStore.setHighlightUrl(false)

    if (!this.originalState) {
      this._storeOriginalState()
    }

    this.detachedId = snapshotProps.id

    this._updateViewport(snapshotProps)
    autStore.updateUrl(snapshotProps.url)

    clearInterval(this.intervalId)

    if (snapshots.length > 1) {
      let i = 0

      this.intervalId = window.setInterval(() => {
        if (this.isSnapshotPinned) return

        i += 1
        if (!snapshots[i]) {
          i = 0
        }

        this._showSnapshotVue(snapshots[i], snapshotProps)
      }, 800)
    }

    this._showSnapshotVue(snapshots[0], snapshotProps)
  }

  /// todo(lachlan): figure out shape of these two args
  _showSnapshotVue = (snapshot: any, snapshotProps: AutSnapshot) => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.showSnapshot(snapshot.name)
    this._restoreDom(snapshot, snapshotProps)
  }

  _restoreDom (snapshot, snapshotProps) {
    this.restoreDom(snapshot)

    if (snapshotProps.$el) {
      this.highlightEl(snapshot, snapshotProps)
    }
  }

  _clearSnapshots = () => {
    const snapshotStore = useSnapshotStore()
    const autStore = useAutStore()

    if (snapshotStore.isSnapshotPinned) return

    clearInterval(this.intervalId)

    autStore.setHighlightUrl(false)

    if (!this.originalState || !this.originalState.body) {
      return snapshotStore.clearMessage()
    }

    const previousDetachedId = this.detachedId

    // process on next tick so we don't restore the dom if we're
    // about to receive another 'show:snapshot' event, else that would
    // be a huge waste
    setTimeout(() => {
      if (!this.originalState) {
        return
      }

      // we want to only restore the dom if we haven't received
      // another snapshot by the time this function runs
      if (previousDetachedId !== this.detachedId) return

      this._updateViewport(this.originalState)
      autStore.updateUrl(this.originalState.url)
      this.restoreDom(this.originalState.snapshot)
      snapshotStore.clearMessage()

      this.originalState = undefined
      this.detachedId = undefined
    })
  }

  _pinSnapshot = (snapshotProps) => {
    const snapshotStore = useSnapshotStore()
    const { snapshots } = snapshotProps

    if (!snapshots || !snapshots.length) {
      this.eventManager.snapshotUnpinned()
      snapshotStore.setMissingSnapshotMessage()

      return
    }

    snapshotStore.pinSnapshot(snapshotProps)

    clearInterval(this.intervalId)

    this._restoreDom(snapshots[0], snapshotProps)
  }

  _unpinSnapshot = () => {
    const snapshotStore = useSnapshotStore()

    snapshotStore.unpinSnapshot()
  }

  _studioOpenError () {
    const snapshotStore = useSnapshotStore()

    snapshotStore.setMessage(
      'Cannot show Snapshot while creating commands in Studio',
      'warning',
    )
  }

  _storeOriginalState () {
    const autStore = useAutStore()
    const finalSnapshot = this.detachDom()

    if (!finalSnapshot) return

    const { body, htmlAttrs } = finalSnapshot

    this.originalState = {
      body,
      htmlAttrs,
      snapshot: finalSnapshot,
      snapshots: [],
      url: autStore.url || '',
      // TODO: use same attr for both runner and runner-ct states.
      // these refer to the same thing - the viewport dimensions.
      viewportWidth: autStore.viewportWidth,
      viewportHeight: autStore.viewportHeight,
    }
  }

  _reset () {
    this.detachedId = undefined
    this.intervalId = undefined
    this.originalState = undefined

    const snapshotStore = useSnapshotStore()

    snapshotStore.setSnapshotPinned(false)
  }
}
