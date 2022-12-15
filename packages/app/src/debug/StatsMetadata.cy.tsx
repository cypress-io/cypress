import StatsMetadata from './StatsMetadata.vue'

describe('mounts correctly', () => {
  it('single values', () => {
    cy.mount(() => (
      <StatsMetadata
        order={['DURATION', 'OS', 'BROWSER', 'TESTING']}
        specDuration={'2:23'}
        os={['LINUX']}
        browser={['CHROME']}
        testing={'component'}
        groups={['a', 'b']}
      />
    ))
  })

  it('group values', () => {
    cy.mount(() => (
      <StatsMetadata
        order={['DURATION', 'GROUPS', 'G_OS', 'G_BROWSERS', 'TESTING']}
        specDuration={'2:23-3:40'}
        os={['LINUX', 'APPLE']}
        browser={['CHROME', 'SAFARI', 'FIREFOX']}
        testing={'e2e'}
        groups={['a', 'b']}
      />
    ))
  })
})

// Go to fix group false and group true rendering
// icons dont work, result counts has not been wired up,
