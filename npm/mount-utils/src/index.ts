/**
 * Additional styles to inject into the document.
 * A component might need 3rd party libraries from CDN,
 * local CSS files and custom styles.
 */
export interface StyleOptions {
  /**
   * Creates <link href="..." /> element for each stylesheet
   * @alias stylesheet
   */
  stylesheets: string | string[]
  /**
   * Creates <link href="..." /> element for each stylesheet
   * @alias stylesheets
   */
  stylesheet: string | string[]
  /**
   * Creates <style>...</style> element and inserts given CSS.
   * @alias styles
   */
  style: string | string[]
  /**
   * Creates <style>...</style> element for each given CSS text.
   * @alias style
   */
  styles: string | string[]
  /**
   * Loads each file and creates a <style>...</style> element
   * with the loaded CSS
   * @alias cssFile
   */
  cssFiles: string | string[]
  /**
   * Single CSS file to load into a <style></style> element
   * @alias cssFile
   */
  cssFile: string | string[]
}

export const ROOT_SELECTOR = '[data-cy-root]'

export const getContainerEl = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(ROOT_SELECTOR)

  if (el) {
    return el
  }

  throw Error(`No element found that matches selector ${ROOT_SELECTOR}. Please add a root element with data-cy-root attribute to your "component-index.html" file so that Cypress can attach your component to the DOM.`)
}

/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 */
export function cleanupStyles () {
  const styles = document.body.querySelectorAll('[data-cy=injected-style-tag]')

  styles.forEach((styleElement) => {
    if (styleElement.parentElement) {
      styleElement.parentElement.removeChild(styleElement)
    }
  })

  const links = document.body.querySelectorAll('[data-cy=injected-stylesheet]')

  links.forEach((link) => {
    if (link.parentElement) {
      link.parentElement.removeChild(link)
    }
  })
}

/**
 * Insert links to external style resources.
 */
function insertStylesheets (
  stylesheets: string[],
  document: Document,
  el: HTMLElement | null,
) {
  stylesheets.forEach((href) => {
    const link = document.createElement('link')

    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.cy = 'injected-stylesheet'
    document.body.insertBefore(link, el)
  })
}

/**
 * Inserts a single stylesheet element
 */
function insertStyles (styles: string[], document: Document, el: HTMLElement | null) {
  styles.forEach((style) => {
    const styleElement = document.createElement('style')

    styleElement.dataset.cy = 'injected-style-tag'
    styleElement.appendChild(document.createTextNode(style))
    document.body.insertBefore(styleElement, el)
  })
}

function insertSingleCssFile (
  cssFilename: string,
  document: Document,
  el: HTMLElement | null,
  log?: boolean,
) {
  return cy.readFile(cssFilename, { log }).then((css) => {
    const style = document.createElement('style')

    style.appendChild(document.createTextNode(css))
    document.body.insertBefore(style, el)
  })
}

/**
 * Reads the given CSS file from local file system
 * and adds the loaded style text as an element.
 */
function insertLocalCssFiles (
  cssFilenames: string[],
  document: Document,
  el: HTMLElement | null,
  log?: boolean,
) {
  return Cypress.Promise.mapSeries(cssFilenames, (cssFilename) => {
    return insertSingleCssFile(cssFilename, document, el, log)
  })
}

/**
 * Injects custom style text or CSS file or 3rd party style resources
 * into the given document.
 */
export const injectStylesBeforeElement = (
  options: Partial<StyleOptions & { log: boolean }>,
  document: Document,
  el: HTMLElement | null,
): HTMLElement => {
  if (!el) return

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

  insertStylesheets(stylesheets, document, el)

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

  insertStyles(styles, document, el)

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

  return insertLocalCssFiles(cssFiles, document, el, options.log)
}

export function setupHooks (optionalCallback?: Function) {
  // Consumed by the framework "mount" libs. A user might register their own mount in the scaffolded 'commands.js'
  // file that is imported by e2e and component support files by default. We don't want CT side effects to run when e2e
  // testing so we early return.
  // System test to verify CT side effects do not pollute e2e: system-tests/test/e2e_with_mount_import_spec.ts
  if (Cypress.testingType !== 'component') {
    return
  }

  // When running component specs, we cannot allow "cy.visit"
  // because it will wipe out our preparation work, and does not make much sense
  // thus we overwrite "cy.visit" to throw an error
  Cypress.Commands.overwrite('visit', () => {
    throw new Error(
      'cy.visit from a component spec is not allowed',
    )
  })

  // @ts-ignore
  Cypress.on('test:before:run', () => {
    optionalCallback?.()
    cleanupStyles()
  })
}
