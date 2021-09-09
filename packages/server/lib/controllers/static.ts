import send from 'send'
import type { Request, Response } from 'express'
import { getPathToDist } from '@packages/resolve-dist'

export const staticCtrl = {
  handle (req: Request, res: Response) {
    const pathToFile = getPathToDist('static', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
