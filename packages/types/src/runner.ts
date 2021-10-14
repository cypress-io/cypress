// Note: this type might be incorrect
export interface AutSnapshot {
  id?: number
  name?: string
  snapshot?: AutSnapshot
  snapshots?: AutSnapshot[]
  htmlAttrs: NamedNodeMap
  viewportHeight: number
  viewportWidth: number
  url: string
  body: {
    get: () => unknown // TOOD: find out what this is, some sort of JQuery API.
  }
}
