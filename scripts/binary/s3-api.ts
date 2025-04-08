const debug = require('debug')('cypress:binary')
import la from 'lazy-ass'
import is from 'check-more-types'
import { CopyObjectCommandInput, CopyObjectCommandOutput, ObjectCannedACL, S3 } from '@aws-sdk/client-s3'

export const hasOnlyStringValues = (o) => {
  return Object.values(o).every((v) => is.unemptyString(v))
}

/**
 * Utility object with methods that deal with S3.
 * Useful for testing our code that calls S3 methods.
 */
export const s3helpers = {
  makeS3 (aws) {
    la(is.unemptyString(aws.accessKeyId), 'missing aws accessKeyId')
    la(is.unemptyString(aws.secretAccessKey), 'missing aws secretAccessKey')

    if (!process.env.CIRCLECI) {
      // sso is not required for CirceCI
      la(is.unemptyString(aws.sessionToken), 'missing aws sessionToken')
    }

    return new S3({
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
        sessionToken: aws.sessionToken,
      },
      region: 'us-east-1',
    })
  },

  verifyZipFileExists (zipFile: string, bucket: string, s3: S3): Promise<null> {
    debug('checking S3 file %s', zipFile)
    debug('bucket %s', bucket)

    return new Promise((resolve, reject) => {
      s3.headObject({
        Bucket: bucket,
        Key: zipFile,
      }, (err, data) => {
        if (err) {
          debug('error getting object %s', zipFile)
          debug(err)

          return reject(err)
        }

        debug('s3 data for %s', zipFile)
        debug(data)
        resolve(null)
      })
    })
  },

  /**
   * Returns list of prefixes in a given folder
   */
  listS3Objects (uploadDir: string, bucket: string, s3: S3): Promise<string[]> {
    la(is.unemptyString(uploadDir), 'invalid upload dir', uploadDir)

    return new Promise((resolve, reject) => {
      const prefix = `${uploadDir}/`

      s3.listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
      }, (err, result) => {
        if (err) {
          return reject(err)
        }

        debug('AWS result in %s %s', bucket, prefix)
        debug('%o', result)

        resolve(result.CommonPrefixes.map((val) => val.Prefix))
      })
    })
  },

  /**
   * Copies one S3 object into another key, metadata is copied.
   * For copying a public zip file use content 'application/zip'
   * and ACL 'public-read'
   */
  copyS3 (sourceKey: string, destinationKey: string, bucket: string,
    contentType: string, acl: ObjectCannedACL,
    s3: S3): Promise<CopyObjectCommandOutput> {
    return new Promise((resolve, reject) => {
      debug('copying %s in bucket %s to %s', sourceKey, bucket, destinationKey)

      const params: CopyObjectCommandInput = {
        Bucket: bucket,
        CopySource: `${bucket}/${sourceKey}`,
        Key: destinationKey,
        // when we copy S3 object, copy the original metadata, if any
        MetadataDirective: 'COPY',
        ContentType: contentType,
        ACL: acl,
      }

      s3.copyObject(params, (err, data) => {
        if (err) {
          return reject(err)
        }

        debug('result of copying')
        debug('%o', data)
        resolve(data)
      })
    })
  },

  /**
   * Returns user metadata for the given S3 object.
   * Note: on S3 when adding user metadata, each key is prefixed with "x-amz-meta-"
   * but the returned object has these prefixes stripped. Thus if we set
   * a single "x-amz-meta-user: gleb", the resolved object will be simply {user: "gleb"}
  */
  getUserMetadata (bucket: string, key: string, s3: S3): Promise<Record<string, string>> {
    return new Promise((resole, reject) => {
      debug('getting user metadata from %s %s', bucket, key)

      s3.headObject({
        Bucket: bucket,
        Key: key,
      }, (err, data) => {
        if (err) {
          return reject(err)
        }

        debug('user metadata')
        debug('%o', data.Metadata)
        resole(data.Metadata)
      })
    })
  },

  /**
   * Setting user metadata can be accomplished with copying the object back onto itself
   * with replaced metadata object.
  */
  setUserMetadata (bucket: string, key: string, metadata: Record<string, string>,
    contentType: string, acl: ObjectCannedACL, s3: S3): Promise<CopyObjectCommandOutput> {
    la(hasOnlyStringValues(metadata),
      'metadata object can only have string values', metadata)

    return new Promise((resolve, reject) => {
      debug('setting metadata to %o for %s %s', metadata, bucket, key)

      const params: CopyObjectCommandInput = {
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: key,
        Metadata: metadata,
        MetadataDirective: 'REPLACE',
        ContentType: contentType,
        ACL: acl,
      }

      s3.copyObject(params, (err, data) => {
        if (err) {
          return reject(err)
        }

        debug('result of copying')
        debug('%o', data)
        resolve(data)
      })
    })
  },
}
