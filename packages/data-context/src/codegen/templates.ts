import * as path from 'path'

const getPath = (dir: string) => path.join(__dirname, dir)

export default {
  component: getPath('./templates/component'),
  story: getPath('./templates/story'),
  integration: getPath('./templates/integration'),
} as const
