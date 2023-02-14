import type { Request, Response } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

export const runner = {
  handle (req: Request, res: Response) {
    const pathToFile = getPathToDist('runner', req.params[0])

    return send(req, pathToFile).pipe(res)
  },
}
