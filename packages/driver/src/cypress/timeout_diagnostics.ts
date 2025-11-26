/**
 * Timeout Diagnostics - Smart suggestions for timeout errors
 * 
 * This module provides contextual diagnostics and actionable suggestions
 * when commands timeout, helping developers quickly identify and fix issues.
 */

import _ from 'lodash'

interface TimeoutContext {
  command: string
  selector?: string
  timeout: number
  previousCommands?: string[]
  networkRequests?: number
  domMutations?: number
  animationsRunning?: boolean
}

interface DiagnosticSuggestion {
  reason: string
  suggestions: string[]
  docsUrl?: string
}

/**
 * Analyzes the context of a timeout error and provides intelligent suggestions
 */
export class TimeoutDiagnostics {
  private static readonly COMMON_PATTERNS = {
    // Selector-based patterns
    dynamicContent: /loading|spinner|skeleton|placeholder/i,
    asyncLoad: /fetch|api|graphql|ajax/i,
    animation: /fade|slide|animate|transition/i,
    
    // Network patterns
    slowNetwork: 3000, // threshold in ms
    manyRequests: 5,
  }

  /**
   * Generate diagnostic suggestions based on timeout context
   */
  static analyze(context: TimeoutContext): DiagnosticSuggestion[] {
    const suggestions: DiagnosticSuggestion[] = []

    // Check for common selector issues
    if (context.selector) {
      suggestions.push(...this.analyzeSelectorIssues(context))
    }

    // Check for network-related issues
    if (context.networkRequests !== undefined) {
      suggestions.push(...this.analyzeNetworkIssues(context))
    }

    // Check for animation issues
    if (context.animationsRunning) {
      suggestions.push(...this.analyzeAnimationIssues(context))
    }

    // Check for DOM mutation issues
    if (context.domMutations !== undefined && context.domMutations > 100) {
      suggestions.push(this.analyzeDOMMutationIssues(context))
    }

    // If no specific issues found, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push(this.getGeneralSuggestions(context))
    }

    return suggestions
  }

  private static analyzeSelectorIssues(context: TimeoutContext): DiagnosticSuggestion[] {
    const suggestions: DiagnosticSuggestion[] = []
    const { selector = '', command } = context

    // Check for dynamic content indicators
    if (this.COMMON_PATTERNS.dynamicContent.test(selector)) {
      const escapedSelector = selector.replace(/'/g, "\\'");

      suggestions.push({
        reason: 'The selector appears to target dynamic/loading content that may not be ready yet',
        suggestions: [
          `If waiting for content to load, wait for the loading indicator to disappear first: cy.get('${escapedSelector}').should('not.exist').then(() => cy.get('[data-cy="content"]'))`,
          'Or wait for the API request: cy.intercept("GET", "/api/*").as("loadData"); cy.wait("@loadData")',
          'Consider using data-cy attributes instead of class names that indicate loading states',
          `If you need the loading element itself, ensure it exists before trying to interact: cy.get('${escapedSelector}').should('exist')`,
        ],
        docsUrl: 'https://on.cypress.io/best-practices#Selecting-Elements',
      })
    }

    // Check for potentially incorrect selectors
    if (selector.includes(' ') && !selector.includes('[') && command === 'get') {
      const escapedFirst = selector.split(' ')[0].replace(/'/g, "\\'");
      const escapedRest = selector.split(' ').slice(1).join(' ').replace(/'/g, "\\'");

      suggestions.push({
        reason: 'Complex selector detected - might be fragile or incorrect',
        suggestions: [
          'Verify the selector in DevTools: copy and paste it into the console',
          'Consider using data-cy attributes for more reliable selection',
          `Break down into multiple steps: cy.get('${escapedFirst}').find('${escapedRest}')`,
        ],
        docsUrl: 'https://on.cypress.io/best-practices#Selecting-Elements',
      })
    }

    // Check for ID selectors that might be dynamic
    if (selector.startsWith('#') && /\d{3,}/.test(selector)) {
      const prefix = selector.split(/\d/)[0];
      const escapedPrefix = prefix.replace(/'/g, "\\'");

      suggestions.push({
        reason: 'Selector uses an ID with numbers - might be dynamically generated',
        suggestions: [
          'Dynamic IDs change between sessions and will cause flaky tests',
          'Use a data-cy attribute or a more stable selector instead',
          `If the ID is dynamic, use a partial match: cy.get('[id^="${escapedPrefix}"]').first()`,
        ],
      })
    }

    return suggestions
  }

  private static analyzeNetworkIssues(context: TimeoutContext): DiagnosticSuggestion[] {
    const suggestions: DiagnosticSuggestion[] = []
    const { networkRequests = 0, timeout } = context

    // Many pending network requests
    if (networkRequests >= this.COMMON_PATTERNS.manyRequests) {
      suggestions.push({
        reason: `${networkRequests} network requests are still pending`,
        suggestions: [
          'Wait for specific API calls to complete using cy.intercept()',
          'Consider increasing the timeout if the requests are expected to be slow',
          'Check if some requests are failing or hanging in the Network tab',
          'Example: cy.intercept("GET", "/api/data").as("getData"); cy.wait("@getData")',
        ],
        docsUrl: 'https://on.cypress.io/intercept',
      })
    }

    // Long timeout suggests waiting for async operation
    if (timeout > this.COMMON_PATTERNS.slowNetwork) {
      suggestions.push({
        reason: 'Long timeout suggests waiting for an async operation',
        suggestions: [
          'Use cy.intercept() to wait for the specific request instead of a timeout',
          'Verify the API endpoint is responding correctly',
          'Check if there are network throttling or CORS issues in DevTools',
          'Consider if the backend service is running and accessible',
        ],
        docsUrl: 'https://on.cypress.io/network-requests',
      })
    }

    return suggestions
  }

  private static analyzeAnimationIssues(context: TimeoutContext): DiagnosticSuggestion[] {
    return [{
      reason: 'Animations are still running when the command timed out',
      suggestions: [
        'Disable animations in tests for faster and more reliable execution',
        'Add to your support file: Cypress.config("animationDistanceThreshold", 0)',
        'Or for specific commands: .click({ waitForAnimations: false })',
        'Ensure CSS animations have a reasonable duration (< 500ms)',
      ],
      docsUrl: 'https://on.cypress.io/actionability#Animations',
    }]
  }

  private static analyzeDOMMutationIssues(context: TimeoutContext): DiagnosticSuggestion {
    return {
      reason: `The DOM is changing rapidly (${context.domMutations} mutations detected)`,
      suggestions: [
        'Wait for the DOM to stabilize before interacting with elements',
        'Use .should() to wait for specific conditions instead of arbitrary waits',
        'Check if there are infinite loops or rapid re-renders in your application',
        'Example: cy.get(selector).should("be.visible").and("not.be.disabled")',
      ],
      docsUrl: 'https://on.cypress.io/retry-ability',
    }
  }

  private static getGeneralSuggestions(context: TimeoutContext): DiagnosticSuggestion {
    const { command, timeout, selector } = context
    const escapedSelector = selector?.replace(/'/g, "\\'")

    const generalSuggestions = [
      `Increase timeout if needed: cy.${command}(${escapedSelector ? `'${escapedSelector}', ` : ''}{ timeout: ${timeout * 2} })`,
      'Verify the element/condition you\'re waiting for actually appears',
      'Check the browser console and Network tab for errors',
      'Use .debug() before the failing command to inspect the state: cy.debug()',
    ]

    // Add command-specific suggestions
    if (['get', 'contains'].includes(command) && selector) {
      const escapedSelector = selector.replace(/'/g, "\\'");

      generalSuggestions.unshift(
        `Verify selector in DevTools: document.querySelector('${escapedSelector}')`,
        'Ensure the element is not hidden by CSS (display: none, visibility: hidden)',
      )
    }

    if (['click', 'type'].includes(command)) {
      generalSuggestions.unshift(
        'Ensure the element is visible, enabled, and not covered by another element',
        'Check if the element is being removed/recreated during the test',
      )
    }

    return {
      reason: `The ${command} command timed out after ${timeout}ms`,
      suggestions: generalSuggestions,
      docsUrl: `https://on.cypress.io/${command}`,
    }
  }

  /**
   * Format diagnostic suggestions into a readable message
   */
  static formatSuggestions(suggestions: DiagnosticSuggestion[]): string {
    if (suggestions.length === 0) return ''

    let output = '\n\n🔍 Diagnostic Suggestions:\n'

    suggestions.forEach((suggestion, index) => {
      output += `\n${index + 1}. ${suggestion.reason}\n`
      
      suggestion.suggestions.forEach((tip, tipIndex) => {
        output += `   ${String.fromCharCode(97 + tipIndex)}) ${tip}\n`
      })

      if (suggestion.docsUrl) {
        output += `   📚 Learn more: ${suggestion.docsUrl}\n`
      }
    })

    return output
  }

  /**
   * Enhanced error message with diagnostics
   */
  static enhanceTimeoutError(originalMessage: string, context: TimeoutContext): string {
    const suggestions = this.analyze(context)
    const diagnostics = this.formatSuggestions(suggestions)
    
    return originalMessage + diagnostics
  }
}

export default TimeoutDiagnostics
