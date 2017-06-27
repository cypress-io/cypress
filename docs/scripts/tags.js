/* global hexo */
/* eslint-disable object-shorthand */

const _ = require('lodash')
const Promise = require('bluebird')
const beepAndLog = require('../lib/beep')
const partial = require('../lib/tags/partial')
const note = require('../lib/tags/note')
const yields = require('../lib/tags/yields')
const requirements = require('../lib/tags/requirements')
const assertions = require('../lib/tags/assertions')
const timeouts = require('../lib/tags/timeouts')
const usageOptions = require('../lib/tags/usage')
const { issue, openAnIssue } = require('../lib/tags/issues')
const { url, urlHash } = require('../lib/tags/url')
const { fa, helperIcon } = require('../lib/tags/icons')

const tags = {
  // partials
  partial: partial,

  // issues
  open_an_issue: openAnIssue,
  issue: issue,

  // icons
  fa: fa,
  helper_icon: helperIcon,

  // usage_options
  usage_options: usageOptions,

  // url
  url: url,
  urlHash: urlHash,

  // yields
  yields: yields,

  // requirements
  requirements: requirements,

  // assertions
  assertions: assertions,

  // timeouts
  timeouts: timeouts,
}

// tags which require ending
const endingTags = {
  // note
  note: note,
}

function promisify (fn) {
  // partial in hexo as 1st argument
  fn = _.partial(fn, hexo)

  // return higher order function
  return function () {
    // call with up hexo context
    /* eslint-disable prefer-rest-params */
    return Promise.resolve(fn.apply(this, arguments))
    .catch(beepAndLog)
  }
}

_.each(tags, (fn, key) => {
  // make all regular tags async and provide 'hexo' as the first argument
  hexo.extend.tag.register(key, promisify(fn), { async: true })
})

_.each(endingTags, (fn, key) => {
  // make all ending tags async and provide 'hexo' as the first argument
  hexo.extend.tag.register(key, promisify(fn), { async: true, ends: true })
})
