import _ from 'lodash'
import check from 'check-more-types'
import la from 'lazy-ass'
import rp from '@cypress/request-promise'

function hasCloudflareEnvironmentVars () {
  return _.chain([process.env.CF_TOKEN, process.env.CF_ZONEID])
  .map(check.unemptyString)
  .every()
  .value()
}

export function purgeCloudflareCache (url) {
  la(
    hasCloudflareEnvironmentVars(),
    'Cannot purge Cloudflare cache without credentials. Ensure that the CF_TOKEN and CF_ZONEID environment variables are set.',
  )

  la(check.webUrl(url), 'Missing url to purge from Cloudflare.')

  console.log(`Found CF_TOKEN and CF_ZONEID, purging Cloudflare cache for ${url}`)

  const { CF_TOKEN, CF_ZONEID } = process.env

  return rp({
    body: {
      files: [url],
    },
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
    },
    json: true,
    method: 'POST',
    url: `https://api.cloudflare.com/client/v4/zones/${CF_ZONEID}/purge_cache`,
  })
  .promise()
  .tap(() => {
    console.log('Cloudflare cache successfully purged.')
  })
  .tapCatch((e) => {
    console.error(`Could not purge ${url}. Error: ${e.message}`)
  })
}
