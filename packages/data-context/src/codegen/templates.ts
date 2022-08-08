import * as path from 'path'
import cypressEx from '@packages/example'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  vueComponent: getPath('./templates/vue-component'),
  componentEmpty: getPath('./templates/empty-component'),
  e2e: getPath('./templates/empty-e2e'),
  scaffoldIntegration: cypressEx.getPathToE2E(),
} as const
