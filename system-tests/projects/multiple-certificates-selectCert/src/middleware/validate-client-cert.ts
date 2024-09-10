import { Request, Response, NextFunction, Handler } from 'express'
import { PeerCertificate, TLSSocket } from 'tls'

// Middleware to verify client certificate
export const validateClientCert: Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tlsSocket = req.socket as TLSSocket
  const cert: PeerCertificate | undefined = tlsSocket.getPeerCertificate()

  if (cert && cert.subject) {
    // Check the common name (CN) of the client certificate
    if (cert.subject.CN === 'admin') {
      res.status(200).send('200: Admin Access Granted')
    } else if (cert.subject.CN === 'user') {
      res.status(200).send('200: User Access Granted')
    } else {
      res.status(401).send('401: Unauthorized')
    }
  } else {
    res.status(404).send('404: Not Found')
  }
}
