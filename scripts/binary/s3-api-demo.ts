// ignore TS errors - we are importing from CoffeeScript files
// @ts-ignore
import uploadUtils from './util/upload'
import { s3helpers } from './s3-api'

const aws = uploadUtils.getS3Credentials()
const s3 = s3helpers.makeS3(aws)

const bucket = aws.bucket
const key = 'beta/binary/3.3.0/darwin-x64/circle-develop-455046b928c861d4457b2ec5426a51de1fda74fd-102212/cypress.zip'
s3helpers.getUserMetadata(key, bucket, s3)
  .then(console.log, console.error)
