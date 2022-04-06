import * as path from 'path'
import cypressEx from '@packages/example'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  component: getPath('./templates/empty'),
  e2e: getPath('./templates/empty'),
  scaffoldIntegration: cypressEx.getPathToE2E(),
} as const
