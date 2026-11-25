import _ from 'lodash'
import md5 from 'md5'
import path from 'path'
import url from 'url'
import $utils from '../cypress/utils'
import LimitedMap from '../util/limited_map'

const anyUrlInCssRe = /url\((['"])([^'"]*)\1\)/g
const screenMediaTypes = ['all', 'screen']

const reduceText = (arr, fn) => {
  return _.reduce(arr, ((memo, item) => {
    return memo + fn(item)
  }), '')
}

// Snapshots are only shown on screen, so a query that names another media type,
// such as `print`, can't apply to one. `(min-width: 735px)` names none, `not print`
// excludes another one and an empty `media` matches every type, so these can.
// https://github.com/cypress-io/cypress/issues/34982
const isScreenMediaQuery = (query: string) => {
  const [first, second] = query.trim().toLowerCase().split(/\s+/)

  if (first === '' || first === 'not' || first.startsWith('(')) {
    return true
  }

  return screenMediaTypes.includes(first === 'only' ? second : first)
}

const isScreenStylesheet = (stylesheet) => {
  const media = stylesheet.getAttribute('media')

  return !_.isString(media) || _.some(media.split(','), isScreenMediaQuery)
}

const getDocumentStylesheets = (doc) => {
  if (!doc) return {}

  return _.transform(doc.styleSheets, (memo, stylesheet) => {
    memo[stylesheet.href] = stylesheet
  }, {})
}

const makePathsAbsoluteToDocCache = new LimitedMap(50)
const makePathsAbsoluteToDoc = $utils.memoize((styles, doc) => {
  if (!_.isString(styles)) return styles

  return styles.replace(anyUrlInCssRe, (_1, _2, filePath) => {
    // the href getter will always resolve an absolute path taking into
    // account things like the current URL and the <base> tag
    const a = doc.createElement('a')

    a.href = filePath

    return `url('${a.href}')`
  })
}, makePathsAbsoluteToDocCache)

const makePathsAbsoluteToStylesheetCache = new LimitedMap(50)
const makePathsAbsoluteToStylesheet = $utils.memoize((styles, href) => {
  if (!_.isString(styles)) {
    return styles
  }

  const stylesheetPath = href.replace(path.basename(href), '')

  return styles.replace(anyUrlInCssRe, (_1, _2, filePath) => {
    const absPath = url.resolve(stylesheetPath, filePath)

    return `url('${absPath}')`
  })
}, makePathsAbsoluteToStylesheetCache)

const getExternalCssContents = (href, stylesheet) => {
  // some browsers may throw a SecurityError if the stylesheet is cross-origin
  // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet#Notes
  // for others, it will just be null
  try {
    const rules = stylesheet.rules || stylesheet.cssRules

    if (rules) {
      const contents = reduceText(rules, (rule) => {
        return rule.cssText
      })

      return makePathsAbsoluteToStylesheet(contents, href)
    }

    return null
  } catch (e) {
    return null
  }
}

const getInlineCssContents = (stylesheet, $$) => {
  if (!stylesheet.sheet) return $$(stylesheet).text()

  const rules = stylesheet.sheet.cssRules

  return reduceText(rules, (rule) => {
    return rule.cssText
  })
}

export const create = ($$, state) => {
  const cssIdToContentsMap = new WeakMap()
  const cssHashedContentsToIdMap = new LimitedMap()
  const cssHrefToIdMap = new LimitedMap()
  const cssHrefToModifiedMap = new LimitedMap()
  let newWindow = false

  // we invalidate the cache when css is modified by javascript
  const onCssModified = (href) => {
    cssHrefToModifiedMap.set(href, { modified: true })
  }

  // the lifecycle of a stylesheet is the lifecycle of the window
  // so track this to know when to re-evaluate the cache in case
  // of css being modified by javascript
  const onBeforeWindowLoad = () => {
    newWindow = true
  }

  const getStyleId = (href, stylesheet) => {
    const hrefModified = cssHrefToModifiedMap.get(href) || {}
    const existing = cssHrefToIdMap.get(href)

    // if we've loaded a new window and the css was invalidated due to javascript
    // we need to re-evaluate since this time around javascript might not change the css
    if (existing && !hrefModified.modified && !(newWindow && hrefModified.modifiedLast)) {
      return existing
    }

    const cssContents = getExternalCssContents(href, stylesheet)

    if (cssContents == null) {
      return
    }

    const hashedCssContents = md5(cssContents)
    // if we already have these css contents stored, don't store them again
    const existingId = cssHashedContentsToIdMap.get(hashedCssContents)

    // id just needs to be a new object reference
    // we add the href for debuggability
    const id = existingId || { hrefId: href }

    cssHrefToIdMap.set(href, id)

    // if we already have these css contents stored, don't store them again
    if (!existingId) {
      cssHashedContentsToIdMap.set(hashedCssContents, id)
      cssIdToContentsMap.set(id, cssContents)
    }

    if (hrefModified.modified) {
      hrefModified.modifiedLast = true
    } else if (newWindow) {
      hrefModified.modifiedLast = false
    }

    hrefModified.modified = false
    cssHrefToModifiedMap.set(href, hrefModified)

    return id
  }

  const getStyleIdsFor = (doc, $$, stylesheets, location) => {
    let styles = $$(location).find('link[rel=\'stylesheet\'],style')

    styles = _.filter(styles, isScreenStylesheet)

    const getElementStyleId = (stylesheet) => {
      // in cases where we can get the CSS as a string, make the paths
      // absolute so that when they're restored by appending them to the page
      // in <style> tags, background images and fonts still properly load
      const href = stylesheet.href

      // if there's an href, it's a link tag
      // return the CSS rules as a string, or, if cross-origin,
      // a reference to the stylesheet's href
      if (href) {
        return getStyleId(href, stylesheets[href]) || { href }
      }

      // otherwise, it's a style tag, and we can just grab its content
      const cssContents = getInlineCssContents(stylesheet, $$)

      return makePathsAbsoluteToDoc(cssContents, doc)
    }

    return _.map(styles, (stylesheet) => {
      const styleId = getElementStyleId(stylesheet)
      const media = stylesheet.getAttribute('media')

      // a media query goes with the restored stylesheet so that it applies only where it
      // did on the page, while `screen` and `all` apply wherever a snapshot is shown
      return media && !screenMediaTypes.includes(media) ? { media, styleId } : styleId
    })
  }

  const getStyleIds = () => {
    const doc = state('document')
    const stylesheets = getDocumentStylesheets(doc)

    const styleIds = {
      headStyleIds: getStyleIdsFor(doc, $$, stylesheets, 'head'),
      bodyStyleIds: getStyleIdsFor(doc, $$, stylesheets, 'body'),
    }

    // after getting the all the styles on the page, it's no longer a new window
    newWindow = false

    return styleIds
  }

  const getStyleById = (idOrCss) => {
    if (_.isString(idOrCss)) {
      return idOrCss
    }

    return cssIdToContentsMap.get(idOrCss) || { href: idOrCss.href }
  }

  const getStylesByIds = (ids) => {
    return _.map(ids, (id) => {
      if (!id.media) {
        return getStyleById(id)
      }

      const style = getStyleById(id.styleId)

      return _.isString(style) ? { css: style, media: id.media } : { ...style, media: id.media }
    })
  }

  return {
    getStyleIds,
    getStylesByIds,
    onCssModified,
    onBeforeWindowLoad,
  }
}
