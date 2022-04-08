import * as path from 'path'
import cypressEx from '@packages/example'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  component: getPath('./templates/component'),
  e2e: getPath('./templates/e2e'),
  scaffoldIntegration: cypressEx.getPathToE2E(),
} as const
