import { useSnapshotStore } from '../spec/snapshot-store'
import { MobxRunnerStore, useMainStore } from '../store'

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

interface Snapshot {
  name?: 'info' | 'pinned' | 'warning'
  htmlAttrs: Record<string, any> // Type is NamedNodeMap, not sure if we should include lib: ["DOM"]
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

    this.eventManager.on('show:snapshot', this._setSnapshotsVue)
    this.eventManager.on('hide:snapshot', this._clearSnapshotsVue)

    this.eventManager.on('pin:snapshot', this._pinSnapshotVue)
    this.eventManager.on('unpin:snapshot', this._unpinSnapshotVue)
  }

  _beforeRun = () => {
    const snapshotStore = useSnapshotStore()

    this.state.isLoading = false
    this.state.isRunning = true
    this.state.resetUrl()
    this.studio.selectorPlaygroundModel.setEnabled(false)
    this._reset()
    snapshotStore.clearMessage()
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

  _setSnapshotsVue = (snapshotProps: AutSnapshot) => {
    const store = useSnapshotStore()
    const mainStore = useMainStore()
    if (store.isSnapshotPinned) {
      return
    }

    if (this.state.isRunning) {
      store.setTestsRunningError()
    }

    if (this.studio.recorder.isOpen) {
      return this._studioOpenError()
    }

    const { snapshots } = snapshotProps

    if (!snapshots || !snapshots.length) {
      this._clearSnapshotsVue()
      store.setMissingSnapshotMessage()

      return
    }

    mainStore.setHighlightUrl(false)

    if (!this.originalState) {
      this._storeOriginalState()
    }

    this.detachedId = snapshotProps.id

    this._updateViewport(snapshotProps)
    mainStore.updateUrl(snapshotProps.url)

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
    const store = useSnapshotStore()
    store.showSnapshot(snapshot.name)
    this._restoreDom(snapshot, snapshotProps)
  }

  _restoreDom (snapshot, snapshotProps) {
    this.restoreDom(snapshot)

    if (snapshotProps.$el) {
      this.highlightEl(snapshot, snapshotProps)
    }
  }

  _clearSnapshotsVue = () => {
    const snapshotStore = useSnapshotStore()
    const mainStore = useMainStore()

    if (snapshotStore.isSnapshotPinned) return

    clearInterval(this.intervalId)

    mainStore.setHighlightUrl(false)

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
      mainStore.updateUrl(this.originalState.url)
      this.restoreDom(this.originalState.snapshot)
      snapshotStore.clearMessage()

      this.originalState = undefined
      this.detachedId = undefined
    })
  }


  _pinSnapshotVue = (snapshotProps) => {
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

  _unpinSnapshotVue = () => {
    const snapshotStore = useSnapshotStore()
    snapshotStore.unpinSnapshot()
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
      snapshots: [],
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

    const store = useSnapshotStore()
    store.setSnapshotPinned(false)
  }
}
