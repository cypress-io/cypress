var _ = require('lodash')
var fs = require('fs-extra')
var str = require('underscore.string')
var path = require('path')
var glob = require('glob')
var Promise = require('bluebird')

var fs = Promise.promisifyAll(fs)
var glob = Promise.promisify(glob)

var startsWithNumberAndDashRe = /(\d+-)/
var excerptRe = /excerpt:.+/
var newLinesRe = /\n{3,}/
var calloutGlobalRe = /\[block:callout\]([^]+?)\[\/block\]/g
var calloutRe = /\[block:callout\]([^]+?)\[\/block\]/

var LOOKUP = {
  guides: 'v0.0',
  api: 'v1.0',
}

getFolderFromFile = function(file) {
  return path.basename(path.resolve(file, '..'))
}

getNameFromFile = function(file) {
  return path.basename(file)
}

normalize = function(string) {
  var string = string.replace(startsWithNumberAndDashRe, '').toLowerCase()

  return str.dasherize(string)
}

find = function(type) {
  var folder = LOOKUP[type]
  var globstar = path.join('cypress', folder, 'documentation', '**', '*.md')

  return glob(globstar, {
    realpath: true
  })
}

transfer = function(type) {
  return find(type).then(function(files = []) {

    return _.filter(files, fileStartsWithNumberAndDash)
  }).map(function(file) {

    var name = normalize(getNameFromFile(file))
    var folder = normalize(getFolderFromFile(file))
    var dest = path.join('source', type, folder, name)

    return copy(file, dest)
    .then(function() {
      return fs.readFileAsync(dest, 'utf8')
    })
    .then(function(string) {
      // slug: foo-bar
      // excerpt: this is our doc on foo bar
      // >> becomes >>
      // title: foo-bar
      // ---

      return string
        .replace('slug:', 'title:')
        .replace(excerptRe, '---')
    })
    .then(function(string) {
      // Remove
      // # Contents
      // - :fa-angle-right: Welcome
      // ***

      var contentsIndex = string.indexOf('# Contents')
      var dividerIndex = string.indexOf('***') + 3
      var chunkToRemove = string.slice(contentsIndex, dividerIndex)

      return string
      .split(chunkToRemove)
      .join('')
      .split(newLinesRe)
      .join('\n\n')
    })
    .then(function(string) {
      // :fa-cog:
      // >> becomes >>
      // {% fa fa-cog %}

      function replace(s, icon) {
        return s
        .replace(":fa-" + icon + ":", "{% fa fa-" + icon + " %}")
      }

      return ["cog", "plus"].reduce(function(memo, icon) {
        return replace(memo, icon)
      }, string)
    })
    .then(function(string) {
      // Content with {{ }} or {% %} get parsed & cause problems
      // {{
      // >> becomes >>
      // {% raw %}{{{% endraw %}

      return string
        .replace('{{', '{% raw %}{{{% endraw %}')
    })
    .then(function(string) {
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
    .then(function(string) {
      return fs.writeFileAsync(dest, string)
    })
  })
}

copy = function(src, dest) {
  return fs.copyAsync(src, dest, {
    overwrite: true
  })
}

fileStartsWithNumberAndDash = function(file) {
  var name = getNameFromFile(file)
  return startsWithNumberAndDashRe.test(name)
}

transferIncomplete = function() {
  return find('guides').then(function(files) {
    if (files == null) {
      files = []
    }
    return _.reject(files, fileStartsWithNumberAndDash)
  }).map(function(file) {
    var dest, folder, name
    name = getNameFromFile(file)
    folder = getFolderFromFile(file)
    dest = path.join('source', 'incomplete', folder, name)
    return copy(file, dest)
  })
}

transferIncomplete().then(function() {
  return Promise.all([transfer('api'), transfer('guides')])
})
