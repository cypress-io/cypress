import * as path from 'path'
import cypressEx from '@packages/example'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  reactComponent: getPath('./templates/react-component'),
  vueComponent: getPath('./templates/vue-component'),
  componentEmpty: getPath('./templates/empty-component'),
  e2e: getPath('./templates/empty-e2e'),
  e2eExamples: cypressEx.getPathToE2E(),
} as const
