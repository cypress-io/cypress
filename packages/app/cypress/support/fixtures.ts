import type { AutSnapshot } from '../../src/runner/iframe-model'

export const autSnapshot: AutSnapshot = {
  id: 1,
  name: 'DOM Test Snapshot',
  $el: null,
  coords: [0, 0],
  scrollBy: {
    x: 0,
    y: 0,
  },
  highlightAttr: '',
  // @ts-ignore
  snapshots: [{ name: 'Before' }, { name: 'After' }],
  htmlAttrs: {},
  viewportHeight: 500,
  viewportWidth: 500,
  url: 'http://localhost:3000',
  body: {
    get: () => {},
  },
}
