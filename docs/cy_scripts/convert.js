let _ = require('lodash')
let str = require('underscore.string')
let path = require('path')
let Promise = require('bluebird')

let fs = Promise.promisifyAll(require('fs-extra'))
let glob = Promise.promisify(require('glob'))

let startsWithNumberAndDashRe = /(\d+-)/
let excerptRe = /excerpt:.+/
let newLinesRe = /\n{3,}/
let calloutGlobalRe = /\[block:callout\]([^]+?)\[\/block\]/g
let calloutRe = /\[block:callout\]([^]+?)\[\/block\]/
let underscoreRe = /_.md/

let LOOKUP = {
  guides: 'v0.0',
  api: 'v1.0',
}

const getFolderFromFile = function (file) {
  return path.basename(path.resolve(file, '..'))
}

const getNameFromFile = function (file) {
  return path.basename(file)
}

const normalize = function (string) {
  // Remove '2-' from '2-Getting-Started.md'
  string = string.replace(startsWithNumberAndDashRe, '').toLowerCase()

  // Don't dasherize our '_.md' file
  if (string.match(underscoreRe)) {
    return string
  }

  return str.dasherize(string)
}

const find = function (type) {
  let folder = LOOKUP[type]
  let globstar = path.join('old_docs', folder, 'documentation', '**', '*.md')

  return glob(globstar, {
    realpath: true,
  })
}

const transfer = function (type) {
  return find(type).then(function (files = []) {
    return _.filter(files, fileStartsWithNumberAndDash)
  }).map(function (file) {
    let name = normalize(getNameFromFile(file))
    let folder = normalize(getFolderFromFile(file))
    let dest = path.join('source', type, folder, name)

    return copy(file, dest)
    .then(function () {
      return fs.readFileAsync(dest, 'utf8')
    })
    .then(function (string) {
      // slug: foo-bar
      // excerpt: this is our doc on foo bar
      // >> becomes >>
      // title: foo-bar
      // comments: true
      // ---

      return string
        .replace('slug:', 'title:')
        .replace(excerptRe, 'comments: true\n---')
    })
    .then(function (string) {
      // Remove
      // # Contents
      // - :fa-angle-right: Welcome
      // ***

      let contentsIndex = string.indexOf('# Contents')
      let dividerIndex = string.indexOf('***') + 3
      let chunkToRemove = string.slice(contentsIndex, dividerIndex)

      return string
      .split(chunkToRemove)
      .join('')
      .split(newLinesRe)
      .join('\n\n')
    })
    .then(function (string) {
      // :fa-cog:
      // >> becomes >>
      // {% fa fa-cog %}

      function replace (s, icon) {
        return s
        .replace(`:fa-${icon}:`, `{% fa fa-${icon} %}`)
      }

      return ['cog', 'plus'].reduce(function (memo, icon) {
        return replace(memo, icon)
      }, string)
    })
    .then(function (string) {
      // Content with {{ }} or {% %} get parsed & cause problems
      // {{
      // >> becomes >>
      // {% raw %}{{{% endraw %}

      return string
        .replace('{{', '{% raw %}{{{% endraw %}')
    })
    .then(function (string) {
      // [block:callout]
      // {
      //   "type": "info",
      //   "body": "Explore talks, blogs, and podcasts about testing in Cypress.",
      //   "title": "Want to see Cypress in action?"
      // }
      // [/block]

      // >> becomes >>

      // {% note info Want to see Cypress in action? %}
      // Explore talks, blogs, and podcasts about testing in Cypress.
      // {% endnote %}

      const callouts = string.match(calloutGlobalRe)
      if (!callouts) return string

      callouts
      .map((callout) => callout.match(calloutRe))
      .forEach((callout) => {
        // callout[0] includes [block:callout]
        // callout[1] is just the JSON string
        let calloutData = JSON.parse(callout[1])

        string = string.replace(
          callout[0],
          `{% note ${calloutData.type} ${calloutData.title ? calloutData.title : ''} %}\n${calloutData.body}\n{% endnote %}`
        )
      })

      return string
    })
    .then(function (string) {
      return fs.writeFileAsync(dest, string)
    })
  })
}

const copy = function (src, dest) {
  return fs.copyAsync(src, dest, {
    overwrite: true,
  })
}

function fileStartsWithNumberAndDash (file) {
  let name = getNameFromFile(file)
  return startsWithNumberAndDashRe.test(name)
}

const transferIncomplete = function () {
  return find('guides').then(function (files) {
    if (files == null) {
      files = []
    }
    return _.reject(files, fileStartsWithNumberAndDash)
  }).map(function (file) {
    let dest
    let folder
    let name
    name = getNameFromFile(file)
    folder = getFolderFromFile(file)
    dest = path.join('source', 'incomplete', folder, name)
    return copy(file, dest)
  })
}

transferIncomplete().then(function () {
  return Promise.all([transfer('api'), transfer('guides')])
})
