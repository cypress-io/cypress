# Writing and Migrating To TypeScript

## Style Guidance

In general, the [ts.dev](https://ts.dev/style/) style guide shall be adhered to as close as possible, with the caveat that end-of-line semicolons are omitted unless necessary to prevent syntax errors.

#### Type Definitions

Prefer `interface` to `type` when possible. Interfaces are never inlined, which solves some potential issues with generated `.d.ts` files.

When to use `type`:
* The type being declared must be a Union type
* Declaration merging may happen when it should not
* Complicated types using utility types

#### Object Literals
When working with a structural implementation, always declare the type.

Correct:
```typescript
interface Foo {
  bar: string
}

const foo: Foo = {
  bar: 'baz',
}
```
Incorrect:
```typescript
const foo = {
  bar: 'baz',
}
```

#### Function Definitions

Always declare types for parameters and return values. Declaring parameter types ensures that callers are providing the correct parameters. Declaring the return type ensures that the function body is returning what is intended. 

_Exception_: inlined single-line arrow functions can usually have their type declarations inferred. This is especially the case if the ultimate return value is declared. Example:
```ts
const odds: string[] = [1,2,3,4,5]
  .filter(n => n % 2)
  .map(n => String(n))
```

**Prefer** inline types. Parameter types and return types often do not need to be referenced outside of the function itself. Bag parameters (object literals with more than two properties) should be declared as a named interface. If possible, do not export this interface. If a dependent needs to reference the bag type because it is composing an object literal in preparation to call the function in question, that dependent should use the [Parameters utility type](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype) instead. This way the interface name can change without necessitating a change to the dependent. Use this technique, example below, as a last resort. Prefer composing the parameter bag inline, rather than assigning it to an identifier.

Choosing definition styles is almost more of an art than a science. Conciseness and flexibility often go hand in hand, but do not compromise on enforcing correctness to achieve conciseness. Fancy type manipulation with mapped types derived from templated types can be satisfying to figure out, but they often indicate leaky abstractions, vague overloads, and so forth. Use with caution.

Incorrect:
```ts
// foo.ts
export const foo({ a, b, n}: { a: string, b: boolean, n: number}): void { }

// baz.ts
export interface BazParam {
  foobar: string
}

export const baz(bag: BazParam) {}

// bar.ts
import { foo } from './foo'
import { BazParam, baz } from './baz'

const bag = {
  a: 'a',
  b: false,
  n: 2
}

foo(bag)

const bazBag: BazParam = {
  foobar: 'buzz'
}
baz(bazBag)
```

Better:
```ts
// foo.ts
interface FooParams {
  a: string
  b: boolean
  n: number
}

export const foo({ a, b, n }: FooParams) {
}

// bar.ts
import { foo } from './foo'

const FooParams = Parameters<typeof foo>[0]

const bag: FooParams = { a: 'a', b: false, n: 2 }
foo(bag)
```

Best:
```ts
// foo.ts
interface FooParams {
  a: string
  b: boolean
  n: number
}

export const foo({ a, b, n }: FooParams) {
}

// bar.ts
import { foo} from './foo'

foo({
  a: 'a',
  b: false,
  n: 2
})
```

#### DRY

If you find yourself defining more than two very similar interfaces or types, consider what can be DRY'd. Is it purely the types, or is there further refactoring that should be done? When DRY, prefer defining the type as close to the implementation that depends on that type as possible. Define parameter bags next to the function they're an argument for, and export them only when necessary. New interfaces should almost never need to be declared for intermediary variables in a function - if you find yourself doing this, there are probably structural refactors that should be considered before DRYing the type definitions.

**Exception to DRY**:

Type declarations composed for public API consumption & definition don't need to be as rigorously DRY'd. Readability and understandability is preferred over conciseness.

## Migration Success Criteria

- No unnecessary `.js` in the repository
- The repository passes linting based on the `@typescript-eslint/recommended-type-checked` rule set
- The repository uses modern eslint: [stylistic](https://eslint.style/) for formatting, various non-formatting-related plugins for code correctness, and the modern flat config pattern.
- Optional / Stretch goal: Define a style guide for the repository that may extend past basic linting and formatting constraints. Initial thoughts:
  - There are no circular dependencies
  - There are no deep imports from undeclared exports

## Execution

For shared language purposes, both packages and files can be categorized as "leaf," "shared," or "root" nodes.
* A Leaf node has no monorepo dependencies
* A Shared node depends on one or more nodes, and is the dependent of one or more node.
* A Root node is not imported by any nodes other than `./cli`


### Stage 1: Typescript Shift

Working through each package from leaf to shared to root nodes, and files within each package from leaf to shared to root files:

- `.js` files are renamed to `.ts`
- Type definitions are added _only_ when adding them does not have a domino effect
- When adding a type definition would have a domino effect, use an `any` type. Because we can warn on the use of `any` types, this serves as an implicit "todo" to come back and fix it.
- Add definitely-typed dependencies as necessary
- Add `@ts-expect-error` directives as necessary - we will warn on them, so they become an implicit "todo".

### Stage 2: Reduce Warnings

Beginning again with packages from leaf to root, and within each from leaf file to root file, begin to address warnings. Addressing warnings should be prioritized based on code quality impact. Loosely:

1. `no-require-imports` is a prerequisite to ESM. We use `require` intentionally in several places, so this requires additional consideration.
2. `no-explicit-any` ensures that we're defining types and interfaces for function parameters and return values. This is the number one tool to help catch bugs and incorrect code. `any` types are a useful escape hatch when first converting a project, but quickly become a crutch. Do the easiest ones first - if you start in on one and realize it has a wide ranging domino effect, add a comment about which other files are involved and move on. That type may become more straightforward to define once other explicit `any` types are filled in.
3. `require-await`, `await-thenable`, and `no-floating-promises` help reduce logical errors and unnecessary microtasks with asynchronous code.

### Stage 3: Enforce previously warned rules as errors

As warnings are removed from packages, those warnings should be converted to errors so they do not re-occur. These rules are specifically called out when overridden in the base eslint configuration.

## Helpful Tips

* If you're working on converting a large file with many exports, try extracting each export into its own file. This can help reduce the scope of necessary changes, and may help resolve circular dependencies.
* Circular dependencies can cause havoc - use [madge](https://www.npmjs.com/package/madge) to detect if the file you're working on is included in a circular dependency cycle, and resolve that before converting the file.
* If you find yourself on a change cascade, pause and back up. Use `any` types to help get to the finish line - we'll warn on them, and they can be fixed later.
