import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

export const handle = (req, res) => {
  const pathToFile = getPathToDist('runner-ct', req.params[0])

  return send(req, pathToFile)
  .pipe(res)
}
