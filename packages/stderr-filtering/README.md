# Stderr Filtering

A Node.js package for standardizing error logging with tags to enable filtering of third-party stderr output to debug streams.

## Overview

This package provides a standardized approach to error logging that allows third-party stderr output to be filtered and redirected to debug output. The primary mechanism is the `logError` function, which wraps error messages with special tags that can be detected and filtered by the stream processing utilities.

## Primary Use Case

The main purpose of this package is to align all node-executed packages in the project with tagged error logging, enabling third-party stderr to be shunted to debug output. This is achieved through:

1. **Standardized error logging** using `logError()` with consistent tags
2. **Stream filtering** at execution boundaries to enforce the filtering behavior

## API Reference

### logError

The primary utility for logging error messages with special tags for stderr filtering.

```typescript
import { logError, START_TAG, END_TAG } from '@packages/stderr-filtering'

// Log an error with filtering tags
logError('Something went wrong')

// Use tags directly if needed
console.error(START_TAG, 'Error message', END_TAG)
```

**Exported Constants:**
- `START_TAG` - Tag that marks the beginning of filterable error content
- `END_TAG` - Tag that marks the end of filterable error content

### FilterTaggedContent

Filters content based on start and end tags, supporting multi-line tagged content. Used at execution boundaries to enforce filtering.

```typescript
import { FilterTaggedContent } from '@packages/stderr-filtering'

const taggedEntries = createWriteStream('taggedEntries.log')
const filter = new FilterTaggedContent('<TAG>', '</TAG>', taggedEntries)

inputStream.pipe(filter).pipe(outputStream)
```

**Constructor Parameters:**
- `startTag: string` - String that marks the beginning of content to filter
- `endTag: string` - String that marks the end of content to filter
- `filtered: Writable` - Stream for filtered content

### FilterPrefixedContent

Filters content based on a prefix pattern, routing matching lines to a filtered stream. Used for additional filtering at execution boundaries.

```typescript
import { FilterPrefixedContent } from '@packages/stderr-filtering'

const errorStream = new Writable()
const filter = new FilterPrefixedContent(/^ERROR:/, errorStream)

inputStream.pipe(filter).pipe(outputStream)
```

**Constructor Parameters:**
- `prefix: RegExp` - Regular expression pattern to test against the beginning of each line
- `filtered: Writable` - Stream for lines that match the prefix pattern

### WriteToDebug

A writable stream that routes incoming data to a debug logger with proper line handling. Used for debug output at execution boundaries.

```typescript
import { WriteToDebug } from '@packages/stderr-filtering'
import debug from 'debug'

const debugLogger = debug('myapp:stream')
const debugStream = new WriteToDebug(debugLogger)

someStream.pipe(debugStream)
```

**Constructor Parameters:**
- `debug: Debugger` - Debug logger instance to write output to

## Usage Examples

### Standard Error Logging

```typescript
import { logError } from '@packages/stderr-filtering'

// Use logError for all error logging to enable filtering
try {
  // Some operation that might fail
} catch (error) {
  logError('Operation failed:', error.message)
}
```

### Execution Boundary Filtering

```typescript
import { FilterTaggedContent, WriteToDebug } from '@packages/stderr-filtering'
import debug from 'debug'

const debugLogger = debug('app:stderr')
const debugStream = new WriteToDebug(debugLogger)

// Filter tagged errors to debug output
const filter = new FilterTaggedContent(
  '<<<CYPRESS.STDERR.START>>>', 
  '<<<CYPRESS.STDERR.END>>>', 
  debugStream
)

// Apply at execution boundary
process.stderr.pipe(filter).pipe(process.stdout)
```

### Basic Error Filtering

```typescript
import { FilterPrefixedContent } from '@packages/stderr-filtering'
import { createWriteStream } from 'fs'

const errorLog = createWriteStream('errors.log')
const filter = new FilterPrefixedContent(/^ERROR:/, errorLog)

process.stderr.pipe(filter).pipe(process.stdout)
```

## Error Handling

The package provides robust error handling throughout the stream processing chain:

- Errors in processing are properly propagated up the stream
- Async operations use proper promise rejection handling
- Stream lifecycle events are handled correctly

## License

This package is part of the Cypress project and is licensed under the MIT License. 