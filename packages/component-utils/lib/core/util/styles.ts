import { StyleOptions } from '../options'
import { getDocument } from './dom'

/**
 * Insert links to external style resources.
 */
function insertStylesheets (
  stylesheets: string[],
  _document: Document,
  el: HTMLElement,
) {
  stylesheets.forEach((href) => {
    const link = _document.createElement('link')

    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = href
    _document.body.insertBefore(link, el)
  })
}

/**
 * Inserts a single stylesheet element
 */
function insertStyles (styles: string[], _document: Document, el: HTMLElement) {
  styles.forEach((style) => {
    const styleElement = _document.createElement('style')

    styleElement.appendChild(_document.createTextNode(style))
    _document.body.insertBefore(styleElement, el)
  })
}

function insertSingleCssFile (
  cssFilename: string,
  _document: Document,
  el: HTMLElement,
  log?: boolean,
) {
  return cy.readFile(cssFilename, { log }).then((css) => {
    const style = _document.createElement('style')

    style.appendChild(_document.createTextNode(css))
    _document.body.insertBefore(style, el)
  })
}

/**
 * Reads the given CSS file from local file system
 * and adds the loaded style text as an element.
 */
function insertLocalCssFiles (
  cssFilenames: string[],
  _document: Document,
  el: HTMLElement,
  log?: boolean,
) {
  return Cypress.Promise.mapSeries(cssFilenames, (cssFilename) => {
    return insertSingleCssFile(cssFilename, _document, el, log)
  })
}

/**
 * Injects custom style text or CSS file or 3rd party style resources
 * into the given document.
 */
export const injectStylesBeforeElement = (
  options: Partial<StyleOptions & { log: boolean }>,
  _document: Document,
  el: HTMLElement,
) => {
  // first insert all stylesheets as Link elements
  let stylesheets: string[] = []

  if (typeof options.stylesheet === 'string') {
    stylesheets.push(options.stylesheet)
  } else if (Array.isArray(options.stylesheet)) {
    stylesheets = stylesheets.concat(options.stylesheet)
  }

  if (typeof options.stylesheets === 'string') {
    options.stylesheets = [options.stylesheets]
  }

  if (options.stylesheets) {
    stylesheets = stylesheets.concat(options.stylesheets)
  }

  insertStylesheets(stylesheets, _document, el)

  // insert any styles as <style>...</style> elements
  let styles: string[] = []

  if (typeof options.style === 'string') {
    styles.push(options.style)
  } else if (Array.isArray(options.style)) {
    styles = styles.concat(options.style)
  }

  if (typeof options.styles === 'string') {
    styles.push(options.styles)
  } else if (Array.isArray(options.styles)) {
    styles = styles.concat(options.styles)
  }

  insertStyles(styles, _document, el)

  // now load any css files by path and add their content
  // as <style>...</style> elements
  let cssFiles: string[] = []

  if (typeof options.cssFile === 'string') {
    cssFiles.push(options.cssFile)
  } else if (Array.isArray(options.cssFile)) {
    cssFiles = cssFiles.concat(options.cssFile)
  }

  if (typeof options.cssFiles === 'string') {
    cssFiles.push(options.cssFiles)
  } else if (Array.isArray(options.cssFiles)) {
    cssFiles = cssFiles.concat(options.cssFiles)
  }

  return insertLocalCssFiles(cssFiles, _document, el, options.log)
}

/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 */
export function cleanupStyles () {
  const _document = getDocument()

  const styles = _document.body.querySelectorAll('style')

  styles.forEach((styleElement) => {
    _document.body.removeChild(styleElement)
  })

  const links = _document.body.querySelectorAll('link[rel=stylesheet]')

  links.forEach((link) => {
    _document.body.removeChild(link)
  })
}
