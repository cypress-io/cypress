/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { TimeoutDiagnostics } from '../../../src/cypress/timeout_diagnostics'

describe('TimeoutDiagnostics', () => {
  describe('analyze', () => {
    it('detects dynamic content selectors', () => {
      const context = {
        command: 'get',
        selector: '.loading-spinner',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].reason).toContain('dynamic/loading content')
      expect(suggestions[0].suggestions.some((s) => s.includes('wait for the loading indicator to disappear'))).toBe(true)
    })

    it('escapes quotes in dynamic content selector suggestions', () => {
      const context = {
        command: 'get',
        selector: '[data-test=\'loading\']',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].suggestions.some((s) => s.includes('\\\''))).toBe(true)
    })

    it('preserves template literal characters in selector suggestions', () => {
      const context = {
        command: 'get',
        selector: '[data-test=`value-${state}`]',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)
      const combined = suggestions.reduce<string[]>((acc, suggestion) => {
        acc.push(...suggestion.suggestions)

        return acc
      }, []).join('\n')

      expect(combined).toContain('`value-${state}`')
      expect(combined).not.toContain('\\`')
      expect(combined).not.toContain('\\${')
    })

    it('detects complex selectors', () => {
      const context = {
        command: 'get',
        selector: 'div .container button.submit',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('Complex selector'))).toBe(true)
    })

    it('detects dynamic ID selectors', () => {
      const context = {
        command: 'get',
        selector: '#user-12345',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('dynamically generated'))).toBe(true)
      const dynamicIdSuggestion = suggestions.find((s) => s.reason.includes('dynamically generated'))

      expect(dynamicIdSuggestion?.suggestions.some((tip) => tip.includes('[id^="user-"'))).toBe(true)
    })

    it('escapes double quotes in dynamic ID suggestions', () => {
      const context = {
        command: 'get',
        selector: '#user"test-12345',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)
      const dynamicIdSuggestion = suggestions.find((s) => s.reason.includes('dynamically generated'))
      const combinedTips = dynamicIdSuggestion?.suggestions.join('\n') ?? ''

      expect(combinedTips).toContain('\\"')
      expect(combinedTips).toContain('[id^="user\\"test-"]')
    })

    it('detects network issues with many pending requests', () => {
      const context = {
        command: 'get',
        selector: '.data-table',
        timeout: 4000,
        networkRequests: 8,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('network requests are still pending'))).toBe(true)
    })

    it('detects long timeout suggesting async operation', () => {
      const context = {
        command: 'contains',
        selector: 'Success',
        timeout: 10000,
        networkRequests: 2,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('async operation'))).toBe(true)
    })

    it('detects animation issues', () => {
      const context = {
        command: 'click',
        selector: '.modal-button',
        timeout: 4000,
        animationsRunning: true,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('Animations are still running'))).toBe(true)
      expect(suggestions.some((s) => {
        return s.suggestions.some((sug) => sug.includes('waitForAnimations: false'))
      })).toBe(true)
    })

    it('detects excessive DOM mutations', () => {
      const context = {
        command: 'get',
        selector: '.list-item',
        timeout: 4000,
        domMutations: 250,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.some((s) => s.reason.includes('DOM is changing rapidly'))).toBe(true)
    })

    it('provides general suggestions when no specific issues detected', () => {
      const context = {
        command: 'get',
        selector: '.simple-div',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].reason).toContain('timed out after 4000ms')
      expect(suggestions[0].suggestions.length).toBeGreaterThan(0)
    })

    it('avoids document.querySelector advice for contains text queries', () => {
      const context = {
        command: 'contains',
        selector: 'Success',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
      const combinedSuggestions = suggestions[0].suggestions.join('\n')

      expect(combinedSuggestions.includes('document.querySelector')).toBe(false)
    })

    it('provides command-specific suggestions for click', () => {
      const context = {
        command: 'click',
        selector: '.button',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions[0].suggestions.some((s) => {
        return s.includes('visible, enabled, and not covered')
      })).toBe(true)
    })

    it('suggests increasing timeout on the querying command for child actions', () => {
      const context = {
        command: 'click',
        selector: '.button',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)
      const combined = suggestions.flatMap((s) => s.suggestions).join('\n')

      expect(combined).toContain(`cy.get('.button').click({ timeout: 8000 })`)
    })

    it('falls back to a placeholder selector when child actions lack context', () => {
      const context = {
        command: 'click',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)
      const combined = suggestions.flatMap((s) => s.suggestions).join('\n')

      expect(combined).toContain('cy.get(/* selector */).click({ timeout: 8000 })')
    })
  })

  describe('formatSuggestions', () => {
    it('formats suggestions with proper structure', () => {
      const suggestions = [
        {
          reason: 'Test reason',
          suggestions: ['Suggestion 1', 'Suggestion 2'],
          docsUrl: 'https://on.cypress.io/test',
        },
      ]

      const formatted = TimeoutDiagnostics.formatSuggestions(suggestions)

      expect(formatted).toContain('🔍 Diagnostic Suggestions:')
      expect(formatted).toContain('1. Test reason')
      expect(formatted).toContain('a) Suggestion 1')
      expect(formatted).toContain('b) Suggestion 2')
      expect(formatted).toContain('📚 Learn more: https://on.cypress.io/test')
    })

    it('handles multiple diagnostic suggestions', () => {
      const suggestions = [
        {
          reason: 'First issue',
          suggestions: ['Fix 1'],
        },
        {
          reason: 'Second issue',
          suggestions: ['Fix 2'],
        },
      ]

      const formatted = TimeoutDiagnostics.formatSuggestions(suggestions)

      expect(formatted).toContain('1. First issue')
      expect(formatted).toContain('2. Second issue')
    })

    it('returns empty string for empty suggestions array', () => {
      const formatted = TimeoutDiagnostics.formatSuggestions([])

      expect(formatted).toBe('')
    })
  })

  describe('enhanceTimeoutError', () => {
    it('enhances error message with diagnostics', () => {
      const originalMessage = 'cy.get() timed out waiting 4000ms'
      const context = {
        command: 'get',
        selector: '.loading',
        timeout: 4000,
      }

      const enhanced = TimeoutDiagnostics.enhanceTimeoutError(originalMessage, context)

      expect(enhanced).toContain(originalMessage)
      expect(enhanced).toContain('🔍 Diagnostic Suggestions:')
      expect(enhanced).toContain('dynamic/loading content')
    })

    it('preserves original message when no diagnostics available', () => {
      const originalMessage = 'cy.wait() timed out'
      const context = {
        command: 'wait',
        timeout: 5000,
      }

      const enhanced = TimeoutDiagnostics.enhanceTimeoutError(originalMessage, context)

      expect(enhanced).toContain(originalMessage)
    })
  })

  describe('edge cases', () => {
    it('handles context with minimal information', () => {
      const context = {
        command: 'custom',
        timeout: 1000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].reason).toContain('timed out')
    })

    it('handles selector with special characters', () => {
      const context = {
        command: 'get',
        selector: '[data-testid="user-profile"]',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions).toHaveLength(1)
    })

    it('escapes quotes in code suggestions to prevent syntax errors', () => {
      const context = {
        command: 'get',
        selector: '[data-test=\'value\']',
        timeout: 4000,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)
      const formatted = TimeoutDiagnostics.formatSuggestions(suggestions)

      // Verify quotes are escaped in suggestions
      expect(formatted.includes('\\\'')).toBe(true)
      // Verify no unescaped single quotes that would break JS
      expect(formatted.match(/cy\.get\('\[data-test='value'\]'\)/)).toBe(null)
    })

    it('combines multiple diagnostic issues', () => {
      const context = {
        command: 'get',
        selector: '.loading-spinner',
        timeout: 8000,
        networkRequests: 6,
        animationsRunning: true,
        domMutations: 150,
      }

      const suggestions = TimeoutDiagnostics.analyze(context)

      expect(suggestions.length).toBeGreaterThan(1)
      expect(suggestions.some((s) => s.reason.includes('dynamic/loading'))).toBe(true)
      expect(suggestions.some((s) => s.reason.includes('network requests'))).toBe(true)
      expect(suggestions.some((s) => s.reason.includes('Animations'))).toBe(true)
      expect(suggestions.some((s) => s.reason.includes('DOM is changing'))).toBe(true)
    })
  })
})
