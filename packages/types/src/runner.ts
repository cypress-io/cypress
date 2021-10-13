export interface AutSnapshot {
  name: string
  htmlAttrs: NamedNodeMap
  body: {
    get: () => unknown // TOOD: find out what this is, some sort of JQuery API.
  }
}
