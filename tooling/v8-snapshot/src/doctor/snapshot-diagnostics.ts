export enum SnapshotDiagnosticCode {
  MixedInlineTypeImport = 'MIXED_INLINE_TYPE_IMPORT',
  TypeOnlyAsValue = 'TYPE_ONLY_AS_VALUE',
  SnapshotCacheViolation = 'SNAPSHOT_CACHE_VIOLATION',
  SnapshotRewriteFailure = 'SNAPSHOT_REWRITE_FAILURE',
  Unknown = 'UNKNOWN',
}

export type SnapshotDiagnostic = {
  code: SnapshotDiagnosticCode
  message: string
  suggestion: string
}

const SNAPSHOT_CACHE_FAILURE = '[SNAPSHOT_CACHE_FAILURE]'
const SNAPSHOT_REWRITE_FAILURE = '[SNAPSHOT_REWRITE_FAILURE]'

const MIXED_INLINE_TYPE_IMPORT =
  /import\s*\{[^}]*\btype\s+[^}]+\}/i

const TYPE_ONLY_AS_VALUE_PATTERNS = [
  /is a type and must be imported using a type-only import/i,
  /was imported as a value/i,
  /Cannot find name/i,
  /imported as type-only/i,
  /type-only export/i,
  /namespace.*type/i,
]

function errorText (error: Error): string {
  return `${error.message}\n${error.stack ?? ''}`
}

/**
 * Classifies snapshot bundler / verifier errors into known patterns with fix suggestions.
 */
export function classifySnapshotError (
  error: Error,
  _file?: string,
): SnapshotDiagnostic {
  const text = errorText(error)

  if (text.includes(SNAPSHOT_REWRITE_FAILURE)) {
    return {
      code: SnapshotDiagnosticCode.SnapshotRewriteFailure,
      message: error.message,
      suggestion:
        'This module cannot be rewritten for snapshot bundling. Add it to the norewrite list or change the source so it does not require rewriting.',
    }
  }

  if (text.includes(SNAPSHOT_CACHE_FAILURE)) {
    return {
      code: SnapshotDiagnosticCode.SnapshotCacheViolation,
      message: error.message,
      suggestion:
        'This module accesses forbidden globals during snapshot creation. Defer the module or avoid using Node.js core modules, native modules, or runtime objects like Error/Promise at module init.',
    }
  }

  if (MIXED_INLINE_TYPE_IMPORT.test(text)) {
    return {
      code: SnapshotDiagnosticCode.MixedInlineTypeImport,
      message: error.message,
      suggestion:
        'Split mixed type and value imports. Use a top-level type import:\n' +
        '  import type { Bar } from \'baz\'\n' +
        '  import { Foo } from \'baz\'\n' +
        'Run ESLint with --fix on snapshot-scoped files (see guides/v8-snapshots.md).',
    }
  }

  if (TYPE_ONLY_AS_VALUE_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      code: SnapshotDiagnosticCode.TypeOnlyAsValue,
      message: error.message,
      suggestion:
        'Use `import type` for type-only bindings and remove runtime references to them.\n' +
        '  import type { MyType } from \'module\'\n' +
        'See guides/v8-snapshots.md#common-source-code-failures.',
    }
  }

  return {
    code: SnapshotDiagnosticCode.Unknown,
    message: error.message,
    suggestion:
      'See guides/v8-snapshots.md#common-source-code-failures and run with DEBUG=cypress:snapgen:* for more detail.',
  }
}

/**
 * Formats a diagnostic for console output.
 */
export function formatSnapshotDiagnostic (
  diagnostic: SnapshotDiagnostic,
  file?: string,
): string {
  const lines = [
    'Snapshot diagnostic:',
    `  Code: ${diagnostic.code}`,
  ]

  if (file != null) {
    lines.push(`  File: ${file}`)
  }

  lines.push(
    `  Error: ${diagnostic.message}`,
    `  Fix: ${diagnostic.suggestion}`,
  )

  return lines.join('\n')
}
