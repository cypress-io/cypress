// ignore TS errors - we are importing from CoffeeScript files
// @ts-ignore
import uploadUtils from './util/upload'
import { s3helpers } from './s3-api'

const aws = uploadUtils.getS3Credentials()
const s3 = s3helpers.makeS3(aws)

const bucket = aws.bucket
const key = 'beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102212/cypress.zip'

/*
  a little demo showing how user metadata can be set and read on a S3 object.
*/

s3helpers.setUserMetadata(bucket, key, {
  user: 'bar',
}, s3)
.then(() => {
  return s3helpers.getUserMetadata(bucket, key, s3)
}).then(console.log, console.error)
