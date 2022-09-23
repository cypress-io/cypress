/* eslint-disable no-redeclare */
/// <reference types="cypress" />

/**
 * Adds XPath support to Cypress using a custom command.
 *
 * @see https://devhints.io/xpath
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_using_XPath_in_JavaScript
 * @example
 ```js
 it('finds list items', () => {
    cy.xpath('//ul[@class="todo-list"]//li')
      .should('have.length', 3)
  })
 ```
 */
const xpath = (subject, selector, options = {}) => {
  /* global XPathResult */
  const isNumber = (xpathResult) => {
    return xpathResult.resultType === XPathResult.NUMBER_TYPE
  }
  const numberResult = (xpathResult) => xpathResult.numberValue

  const isString = (xpathResult) => {
    return xpathResult.resultType === XPathResult.STRING_TYPE
  }
  const stringResult = (xpathResult) => xpathResult.stringValue

  const isBoolean = (xpathResult) => {
    return xpathResult.resultType === XPathResult.BOOLEAN_TYPE
  }
  const booleanResult = (xpathResult) => xpathResult.booleanValue

  const isPrimitive = (x) => {
    return Cypress._.isNumber(x) || Cypress._.isString(x) || Cypress._.isBoolean(x)
  }

  // options to log later
  const log = {
    name: 'xpath',
    message: selector,
  }

  if (Cypress.dom.isElement(subject) && subject.length > 1) {
    throw new Error(
      `xpath() can only be called on a single element. Your subject contained ${
          subject.length
          } elements.`,
    )
  }

  const getValue = () => {
    let nodes = []
    let contextNode
    let withinSubject = cy.state('withinSubject')

    if (Cypress.dom.isElement(subject)) {
      contextNode = subject[0]
    } else if (Cypress.dom.isDocument(subject)) {
      contextNode = subject
    } else if (withinSubject) {
      contextNode = withinSubject[0]
    } else {
      contextNode = cy.state('window').document
    }

    let iterator = (contextNode.ownerDocument || contextNode).evaluate(
      selector,
      contextNode,
    )

    if (isNumber(iterator)) {
      const result = numberResult(iterator)

      log.consoleProps = () => {
        return {
          XPath: selector,
          type: 'number',
          result,
        }
      }

      return result
    }

    if (isString(iterator)) {
      const result = stringResult(iterator)

      log.consoleProps = () => {
        return {
          XPath: selector,
          type: 'string',
          result,
        }
      }

      return result
    }

    if (isBoolean(iterator)) {
      const result = booleanResult(iterator)

      log.consoleProps = () => {
        return {
          XPath: selector,
          type: 'boolean',
          result,
        }
      }

      return result
    }

    try {
      let node = iterator.iterateNext()

      while (node) {
        nodes.push(node)
        node = iterator.iterateNext()
      }

      log.consoleProps = () => {
        return {
          XPath: selector,
          result: nodes.length === 1 ? nodes[0] : nodes,
        }
      }

      return nodes
    } catch (e) {
      console.error('Document tree modified during iteration', e)

      return null
    }
  }

  const resolveValue = () => {
    return Cypress.Promise.try(getValue).then((value) => {
      if (!isPrimitive(value)) {
        value = Cypress.$(value)
        // Add the ".selector" property because Cypress uses it for error messages
        value.selector = selector
      }

      return cy.verifyUpcomingAssertions(value, options, {
        onRetry: resolveValue,
      })
    })
  }

  return resolveValue().then((value) => {
    if (options.log !== false) {
      // TODO set found elements on the command log?
      Cypress.log(log)
    }

    return value
  })
}

Cypress.Commands.add(
  'xpath',
  { prevSubject: ['optional', 'element', 'document'] },
  xpath,
)
