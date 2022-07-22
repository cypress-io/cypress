import * as path from 'path'
import cypressEx from '@packages/example'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  vue2Component: getPath('./templates/vue2-component'),
  vue3Component: getPath('./templates/vue3-component'),
  componentEmpty: getPath('./templates/empty-component'),
  e2e: getPath('./templates/empty-e2e'),
  scaffoldIntegration: cypressEx.getPathToE2E(),
} as const
