import { expect } from 'chai'
import {
  classifySnapshotError,
  formatSnapshotDiagnostic,
  SnapshotDiagnosticCode,
} from '../../src/doctor/snapshot-diagnostics'

describe('snapshot-diagnostics', () => {
  it('classifies mixed inline type imports', () => {
    const err = new Error(
      'Transform failed: import { Foo, type Bar } from "baz"',
    )

    const diagnostic = classifySnapshotError(err)

    expect(diagnostic.code).to.equal(
      SnapshotDiagnosticCode.MixedInlineTypeImport,
    )

    expect(diagnostic.suggestion).to.include('import type { Bar }')
  })

  it('classifies type-only bindings used as values', () => {
    const err = new Error(
      'MyType is a type and must be imported using a type-only import when \'verbatimModuleSyntax\' is enabled',
    )

    const diagnostic = classifySnapshotError(err)

    expect(diagnostic.code).to.equal(SnapshotDiagnosticCode.TypeOnlyAsValue)
    expect(diagnostic.suggestion).to.include('import type')
  })

  it('classifies snapshot cache failures', () => {
    const err = new Error(
      '[SNAPSHOT_CACHE_FAILURE] Cannot access Buffer during snapshot creation',
    )

    const diagnostic = classifySnapshotError(err)

    expect(diagnostic.code).to.equal(
      SnapshotDiagnosticCode.SnapshotCacheViolation,
    )
  })

  it('classifies snapshot rewrite failures', () => {
    const err = new Error('[SNAPSHOT_REWRITE_FAILURE] invalid rewrite')

    const diagnostic = classifySnapshotError(err)

    expect(diagnostic.code).to.equal(
      SnapshotDiagnosticCode.SnapshotRewriteFailure,
    )
  })

  it('preserves unknown error messages', () => {
    const err = new Error('something completely unexpected')

    const diagnostic = classifySnapshotError(err)

    expect(diagnostic.code).to.equal(SnapshotDiagnosticCode.Unknown)
    expect(diagnostic.message).to.equal('something completely unexpected')
  })

  it('formats diagnostics with file paths', () => {
    const formatted = formatSnapshotDiagnostic(
      {
        code: SnapshotDiagnosticCode.MixedInlineTypeImport,
        message: 'bad import',
        suggestion: 'split imports',
      },
      './packages/server/lib/foo.ts',
    )

    expect(formatted).to.include('MIXED_INLINE_TYPE_IMPORT')
    expect(formatted).to.include('./packages/server/lib/foo.ts')
    expect(formatted).to.include('split imports')
  })
})
