import { expect } from 'chai'
import { execFileSync, spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const script = path.join(__dirname, '..', 'check-markdown-links.mts')

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe' })

const write = (root: string, file: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), content)
}

const check = (cwd: string) => {
  const result = spawnSync(process.execPath, [script, '--base', 'base'], { cwd, encoding: 'utf8' })

  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('check-markdown-links', () => {
  let repo: string

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'check-markdown-links-'))
    git(repo, 'init', '-q', '-b', 'base')
    git(repo, 'config', 'user.email', 'dana.whitfield@example.com')
    git(repo, 'config', 'user.name', 'Dana Whitfield')

    write(repo, 'README.md', [
      '# Acme Widgets',
      '',
      '![Overview](./assets/overview.gif)',
      '',
      'See the [setup guide](guides/setup.md#install) and [old notes](./guides/retired.md).',
      '',
    ].join('\n'))

    write(repo, 'guides/setup.md', '# Setup\n\nBack to the [README](/README.md).\n')
    write(repo, 'assets/overview.gif', 'GIF89a')
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'initial docs')
    git(repo, 'checkout', '-q', '-b', 'docs-change')
  })

  afterEach(() => {
    fs.rmSync(repo, { recursive: true, force: true })
  })

  it('passes when added links resolve, ignoring a broken link the change did not add', () => {
    fs.appendFileSync(path.join(repo, 'README.md'), [
      'Read [setup](./guides/setup.md), browse the [assets](assets/) folder, or visit [the docs](https://docs.example.com/widgets).',
      'Jump to [Install](#install) or [email us](mailto:support@example.com).',
      '',
    ].join('\n'))

    const { status, output } = check(repo)

    expect(status, output).to.eq(0)
    expect(output).to.include('Checked 1 Markdown file(s)')
  })

  it('reports an added link to a missing file, with its line', () => {
    fs.appendFileSync(path.join(repo, 'README.md'), 'Read the [FAQ](./guides/faq.md).\n')

    const { status, output } = check(repo)

    expect(status).to.eq(1)
    expect(output).to.include('README.md:6  ./guides/faq.md  (no such file in the repo)')
    expect(output).not.to.include('retired.md')
  })

  it('checks every line of an untracked Markdown file', () => {
    write(repo, 'guides/upgrade.md', '# Upgrade\n\n<img src="../assets/upgrade-diagram.png" alt="Upgrade steps">\n')

    const { status, output } = check(repo)

    expect(status).to.eq(1)
    expect(output).to.include('guides/upgrade.md:3  ../assets/upgrade-diagram.png')
  })

  it('reports links in unchanged files to a file the change deletes', () => {
    git(repo, 'rm', '-q', 'assets/overview.gif')

    const { status, output } = check(repo)

    expect(status).to.eq(1)
    expect(output).to.include('README.md:3  ./assets/overview.gif  (links to a file this change deletes)')
  })

  it('ignores links inside code fences, code spans and HTML comments', () => {
    fs.appendFileSync(path.join(repo, 'README.md'), [
      '```md',
      '[example](./does-not-exist.md)',
      '```',
      'Write links as `[text](./path.md)`.',
      '<!-- [draft](./draft.md) -->',
      '',
    ].join('\n'))

    const { status, output } = check(repo)

    expect(status, output).to.eq(0)
  })
})
