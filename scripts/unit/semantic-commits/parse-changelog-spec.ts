import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { parseChangelog } from '../../semantic-commits/parse-changelog'

use(chaiAsPromised)

const changelog = (...lines: string[]) => ['<!-- comment -->', ...lines].join('\n')

describe('semantic-pull-request/parse-changelog', () => {
  it('collects the entries of each section', async () => {
    const sections = await parseChangelog({
      changelogContent: changelog(
        '## 16.0.1',
        '',
        '**Performance:**',
        '',
        '- made it faster',
        '',
        '**Bugfixes:**',
        '',
        '- fixed a thing',
      ),
    })

    expect(sections['version']).to.eq('## 16.0.1')
    expect(sections['**Performance:**']).to.include('- made it faster')
    expect(sections['**Bugfixes:**']).to.include('- fixed a thing')
  })

  it('stops parsing at the previous release', async () => {
    const sections = await parseChangelog({
      changelogContent: changelog(
        '## 16.0.1',
        '',
        '**Misc:**',
        '',
        '- current release',
        '',
        '## 16.0.0',
        '',
        '**Misc:**',
        '',
        '- previous release',
      ),
    })

    expect(sections['**Misc:**']).to.include('- current release')
    expect(sections['**Misc:**']).to.not.include('- previous release')
  })

  it('throws when the version heading is not on the second line', async () => {
    await expect(parseChangelog({
      changelogContent: '## 16.0.1\n\n**Misc:**\n\n- a',
    })).to.be.rejectedWith('Expected line number 2 to include "## x.x.x"')
  })

  it('throws when a section header is not a known change section', async () => {
    await expect(parseChangelog({
      changelogContent: changelog('## 16.0.1', '', '**Summary:**', '', '- a'),
    })).to.be.rejectedWith('Expected line number 4 to be a valid section header')
  })

  it('throws when a section header repeats immediately after its own block', async () => {
    await expect(parseChangelog({
      changelogContent: changelog(
        '## 16.0.1',
        '',
        '**Misc:**',
        '',
        '- first',
        '',
        '**Misc:**',
        '',
        '- second',
      ),
    })).to.be.rejectedWith('Duplicate section header of "**Misc:**" on line number 8')
  })

  it('throws when a section header repeats after an intervening section', async () => {
    await expect(parseChangelog({
      changelogContent: changelog(
        '## 16.0.1',
        '',
        '**Misc:**',
        '',
        '- first',
        '',
        '**Bugfixes:**',
        '',
        '- a fix',
        '',
        '**Misc:**',
        '',
        '- second',
      ),
    })).to.be.rejectedWith('Duplicate section header of "**Misc:**" on line number 12')
  })
})
