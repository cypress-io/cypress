/**
 * Virtual Scrolling Browser Crash Tests
 *
 * This test suite is designed to reproduce browser crashes when scrolling
 * with virtual scroll libraries, as reported by users.
 *
 * Test scenarios include:
 * - Basic virtual list scrolling
 * - Dynamic height virtual lists
 * - Multiple virtual lists simultaneously
 * - Extreme stress tests with large datasets
 * - Rapid scrolling patterns that may cause crashes
 */

describe('Virtual Scrolling Stress Tests', {
  experimentalFastVisibility: true,
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.visit('/fixtures/virtual-scroll-stress-test.html')

    cy.get('.header').should('be.visible')

    // Clear any existing data
    cy.window().then((win) => {
      if (win.clearBasicList) win.clearBasicList()

      if (win.clearDynamicList) win.clearDynamicList()

      if (win.clearMultipleLists) win.clearMultipleLists()

      if (win.clearExtremeList) win.clearExtremeList()
    })
  })

  describe('Basic Virtual List Tests', () => {
    it('should load basic virtual list without crashing', () => {
      cy.get('button').contains('Load Basic List').click()

      cy.get('#basicList .item')
      .should('have.length.greaterThan', 0)
    })

    it('should handle normal scrolling without crashing', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Perform normal scrolling
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#basicList').scrollTo(0, 2000)
      cy.get('#basicList').scrollTo(0, 5000)
    })

    it('should handle rapid scrolling without crashing', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Perform rapid scrolling
      cy.get('#basicList').scrollTo(0, 100)
      cy.get('#basicList').scrollTo(0, 300)
      cy.get('#basicList').scrollTo(0, 600)
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#basicList').scrollTo(0, 1500)
      cy.get('#basicList').scrollTo(0, 2000)
    })

    it('should handle stress scrolling without crashing', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Trigger stress scrolling
      cy.get('button').contains('Stress Scroll').click()

      // Wait for stress scrolling to complete
      cy.wait(2000)

      // Verify the page is still responsive
      cy.get('#basicScrolls').should('be.visible')
      cy.get('#basicItems').should('contain', '10000')
    })

    it('should handle scrolling to bottom and back to top', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Scroll to bottom
      cy.get('#basicList').scrollTo('bottom')
      cy.wait(500)

      // Scroll back to top
      cy.get('#basicList').scrollTo('top')
      cy.wait(500)

      // Verify page is still responsive
      cy.get('#basicScrolls').should('be.visible')
    })
  })

  describe('Dynamic Height Virtual List Tests', () => {
    it('should load dynamic height list without crashing', () => {
      // Load the dynamic list
      cy.get('button').contains('Load Dynamic List').click()

      // Wait for items to load
      cy.get('#dynamicItems').should('contain', '5000')
      cy.get('.loading').should('not.exist')

      // Verify the virtual list is rendered
      cy.get('#dynamicList').should('be.visible')
      cy.get('#dynamicList .item').should('have.length.greaterThan', 0)
    })

    it('should handle scrolling with dynamic heights without crashing', () => {
      // Load the dynamic list
      cy.get('button').contains('Load Dynamic List').click()
      cy.get('#dynamicItems').should('contain', '5000')

      // Perform scrolling with dynamic heights
      cy.get('#dynamicList').scrollTo(0, 500)
      cy.get('#dynamicList').scrollTo(0, 1000)
      cy.get('#dynamicList').scrollTo(0, 2000)
    })

    it('should handle rapid scrolling with dynamic heights', () => {
      // Load the dynamic list
      cy.get('button').contains('Load Dynamic List').click()
      cy.get('#dynamicItems').should('contain', '5000')

      // Trigger rapid scrolling
      cy.get('button').contains('Rapid Scroll').click()

      // Wait for rapid scrolling to complete
      cy.wait(1500)

      // Verify the page is still responsive
      cy.get('#dynamicScrolls').should('be.visible')
      cy.get('#dynamicItems').should('contain', '5000')
    })
  })

  describe('Multiple Virtual Lists Tests', () => {
    it('should load multiple lists without crashing', () => {
      // Load multiple lists
      cy.get('button').contains('Load Multiple Lists').click()

      // Wait for items to load
      cy.get('#multipleItems').should('contain', '6000')
      cy.get('.loading').should('not.exist')

      // Verify both lists are rendered
      cy.get('#multipleListA').should('be.visible')
      cy.get('#multipleListB').should('be.visible')
      cy.get('#multipleListA .item').should('have.length.greaterThan', 0)
      cy.get('#multipleListB .item').should('have.length.greaterThan', 0)
    })

    it('should handle simultaneous scrolling of multiple lists', () => {
      // Load multiple lists
      cy.get('button').contains('Load Multiple Lists').click()
      cy.get('#multipleItems').should('contain', '6000')

      // Scroll both lists simultaneously
      cy.get('#multipleListA').scrollTo(0, 1000)
      cy.get('#multipleListB').scrollTo(0, 1500)
    })

    it('should handle stress scrolling multiple lists', () => {
      // Load multiple lists
      cy.get('button').contains('Load Multiple Lists').click()
      cy.get('#multipleItems').should('contain', '6000')

      // Trigger stress scrolling on multiple lists
      cy.get('button').contains('Stress Test All').click()

      // Wait for stress scrolling to complete
      cy.wait(3000)

      // Verify the page is still responsive
      cy.get('#multipleScrolls').should('be.visible')
      cy.get('#multipleItems').should('contain', '6000')
    })

    it('should handle alternating scroll between lists', () => {
      // Load multiple lists
      cy.get('button').contains('Load Multiple Lists').click()
      cy.get('#multipleItems').should('contain', '6000')

      // Alternate scrolling between lists
      cy.get('#multipleListA').scrollTo(0, 500)
      cy.get('#multipleListB').scrollTo(0, 500)
      cy.get('#multipleListA').scrollTo(0, 1000)
      cy.get('#multipleListB').scrollTo(0, 1000)
      cy.get('#multipleListA').scrollTo(0, 1500)
      cy.get('#multipleListB').scrollTo(0, 1500)
    })
  })

  describe('Extreme Stress Tests', () => {
    it('should load extreme list without crashing', () => {
      // Load the extreme list
      cy.get('button').contains('Load Extreme List').click()

      // Wait for items to load (this may take longer)
      cy.get('#extremeItems', { timeout: 10000 }).should('contain', '50000')
      cy.get('.loading').should('not.exist')

      // Verify the virtual list is rendered
      cy.get('#extremeList').should('be.visible')
      cy.get('#extremeList .item').should('have.length.greaterThan', 0)
    })

    it('should handle extreme scrolling without crashing', () => {
      // Load the extreme list
      cy.get('button').contains('Load Extreme List').click()
      cy.get('#extremeItems', { timeout: 10000 }).should('contain', '50000')

      // Perform extreme scrolling
      cy.get('#extremeList').scrollTo(0, 5000)
      cy.get('#extremeList').scrollTo(0, 10000)
      cy.get('#extremeList').scrollTo(0, 20000)
    })

    it('should handle extreme stress scrolling test', () => {
      // Load the extreme list
      cy.get('button').contains('Load Extreme List').click()
      cy.get('#extremeItems', { timeout: 10000 }).should('contain', '50000')

      // Trigger extreme scroll test
      cy.get('button').contains('Extreme Scroll Test').click()

      // Wait for extreme scrolling to complete
      cy.wait(5000)

      // Verify the page is still responsive
      cy.get('#extremeScrolls').should('be.visible')
      cy.get('#extremeItems').should('contain', '50000')
    })

    it('should handle rapid scrolling with heavy operations', () => {
      // Load the extreme list
      cy.get('button').contains('Load Extreme List').click()
      cy.get('#extremeItems', { timeout: 10000 }).should('contain', '50000')

      // Click heavy operation buttons while scrolling
      cy.get('#extremeList').scrollTo(0, 1000)
      cy.get('#extremeList .item-btn').first().click()
      cy.get('#extremeList').scrollTo(0, 2000)
      cy.get('#extremeList .item-btn').eq(1).click()
      cy.get('#extremeList').scrollTo(0, 3000)
      cy.get('#extremeList .item-btn').eq(2).click()
    })
  })

  describe('Memory and Performance Tests', () => {
    it('should handle memory pressure from multiple large lists', () => {
      // Load all lists simultaneously
      cy.get('button').contains('Load Basic List').click()
      cy.get('button').contains('Load Dynamic List').click()
      cy.get('button').contains('Load Multiple Lists').click()
      cy.get('button').contains('Load Extreme List').click()

      // Wait for all lists to load
      cy.get('#basicItems').should('contain', '10000')
      cy.get('#dynamicItems').should('contain', '5000')
      cy.get('#multipleItems').should('contain', '6000')
      cy.get('#extremeItems', { timeout: 15000 }).should('contain', '50000')

      // Perform scrolling on all lists
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#dynamicList').scrollTo(0, 1000)
      cy.get('#multipleListA').scrollTo(0, 1000)
      cy.get('#multipleListB').scrollTo(0, 1000)
      cy.get('#extremeList').scrollTo(0, 1000)
    })

    it('should handle rapid scroll direction changes', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Rapid scroll direction changes
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#basicList').scrollTo(0, 500)
      cy.get('#basicList').scrollTo(0, 1500)
      cy.get('#basicList').scrollTo(0, 800)
      cy.get('#basicList').scrollTo(0, 2000)
      cy.get('#basicList').scrollTo(0, 1200)
    })

    it('should handle scroll with rapid item interactions', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Scroll and interact with items rapidly
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#basicList .item-btn').first().click()
      cy.get('#basicList').scrollTo(0, 2000)
      cy.get('#basicList .item-btn').eq(1).click()
      cy.get('#basicList').scrollTo(0, 3000)
      cy.get('#basicList .item-btn').eq(2).click()
    })
  })

  describe('Browser Crash Detection Tests', () => {
    it('should detect if browser becomes unresponsive', () => {
      // Load the extreme list
      cy.get('button').contains('Load Extreme List').click()
      cy.get('#extremeItems', { timeout: 10000 }).should('contain', '50000')

      // Perform operations that might cause crashes
      cy.get('button').contains('Extreme Scroll Test').click()

      // Wait and check if page is still responsive
      cy.wait(2000)

      // Try to interact with the page
      cy.get('#extremeScrolls').should('be.visible')
      cy.get('button').contains('Clear List').should('be.visible')

      // Try to scroll the main page
      cy.scrollTo(0, 500)
      cy.scrollTo(0, 0)
    })

    it('should detect memory leaks during extended scrolling', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Perform extended scrolling
      for (let i = 0; i < 10; i++) {
        cy.get('#basicList').scrollTo(0, i * 1000)
        cy.wait(100)
      }

      // Verify the page is still responsive
      cy.get('#basicScrolls').should('be.visible')
      cy.get('#basicItems').should('contain', '10000')
    })

    it('should handle scroll with rapid list clearing and reloading', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Scroll a bit
      cy.get('#basicList').scrollTo(0, 1000)

      // Clear and reload multiple times
      cy.get('button').contains('Clear List').click()
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      cy.get('button').contains('Clear List').click()
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Verify the page is still responsive
      cy.get('#basicScrolls').should('be.visible')
    })
  })

  describe('Cross-Browser Compatibility Tests', () => {
    it('should work with different scroll behaviors', () => {
      // Load the basic list
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')

      // Test different scroll methods
      cy.get('#basicList').scrollTo(0, 1000)
      cy.get('#basicList').scrollTo('bottom')
      cy.get('#basicList').scrollTo('top')
      cy.get('#basicList').scrollTo(0, 5000)
    })

    it('should handle scroll with different viewport sizes', () => {
      // Test with different viewport sizes
      cy.viewport(1920, 1080)
      cy.get('button').contains('Load Basic List').click()
      cy.get('#basicItems').should('contain', '10000')
      cy.get('#basicList').scrollTo(0, 1000)

      cy.viewport(1366, 768)
      cy.get('#basicList').scrollTo(0, 2000)

      cy.viewport(1024, 768)
      cy.get('#basicList').scrollTo(0, 3000)
    })
  })
})
