## @packages/data-context

Centralized data access for the Cypress application

## Directories & Concepts

There are several directories in `src`:

- `actions`
- `codegen`
- `data`
- `gen`
- `sources`
- `util`

The main ones you need to know about are `data`, `sources` and `actions`.

Here are some general guidelines associated with each, and an example showing how they are used together.

### Data

This contains the interfaces that describe the top level data (called `coreData`) that is exposed and used by launchpad and app. Secondary data that isn't exposed to the outside world (temporary states, flags, etc) is usually in a Source. Sources are also used to derive data.

If you want to update Data, you use an Action (see below).

### Sources

The sources directory contains what can be thought of as "read only" and "derived" data. Each one is namespaced based on the kind of data it's associated with, for example Project, Browser, Settings, etc. Sources can access the `ctx` (type `DataContext`, see [`DataContext.ts`](./DataContext.ts)), using `this.ctx`.

If you want to update something in a Source, or in `coreData`, you want to do it using an Action.

### Actions

Actions are where mutative and destructive operations live. To make this predictable and changes each to track, updating `this.ctx.coreData` should be done via an Action and use `this.ctx.update`, which receives the current `coreData` as the first argument.

## Example

In this example, we will load some specs for a project and persist them. We will use a Source to derive any specs with the characters "foo" in the filename. This shows how Data, Sources and Actions are connected.

### 1. Define Data [data/coreData](./data/coreDataShape.ts)

First we define the type in `CoreDataShape` and set the initial value in `makeCoreData`.

```ts
export interface CoreDataShape {
  specs: string[]
}

// ...

export function makeCoreData (modeOptions: Partial<AllModeOptions> = {}): CoreDataShape {
  return {
    // ...
    specs: [],
  }
}
```

This is where the actual value will be saved.

### 2. Define Action to Update Specs

We need some way to update the value. For this, we are defining a new `SpecActions` class inside of `actions` and updating the `coreData` with `this.ctx.update`.

```ts
import type { DataContext } from '..'
import globby from 'globby'

export class SpecActions {
  constructor (private ctx: DataContext) {}

  async findSpecs () {
    const specs = await globby('./**/*.spec.js')
    this.ctx.update(coreData => {
      coreData.specs = specs
    })
  }
}
```

**Note**: If you added a new Action file, you will also need to add it to [`DataActions.ts`](./DataActions.ts), although this isn't very common.

```ts
import type { DataContext } from '.'
import {
  // ...
  SpecActions 
} from './actions'
import { cached } from './util'

export class DataActions {
  constructor (private ctx: DataContext) {}
  
  // ...

  @cached
  get specs () {
    return new SpecActions(this.ctx)
  }
}
```

### 3. Derive the Data with a Source

In this example we only want to expose specs with `foo` in the name. We can derive this using a Source. This will be a new Source call `SpecDataSource`, but you can use an existing one if it makes sense.

```ts
import type { DataContext } from '..'

export class SpecDataSource {
  constructor (private ctx: DataContext) {}

  fooSpecs () {
    return this.ctx.coreData.specs.find(spec => spec.includes('foo'))
  }
}
```

If you added a new Source, you need to add it to [`DataContext.ts`](./DataContext.ts). 

```ts
import { SpecDataSource } from './sources/SpecDataSource'

export class DataContext {

  // ...

  @cached
  get specs () {
    return new SpecDataSource(this)
  }
}
```

### 4. (Bonus) Expose via GraphQL

You might want to expose your new Data or Source via GraphQL. It's easy, since GraphQL also has access `ctx` as the third argument to the resolvers. For example, we can expose `specs` and `fooSpecs` in [`gql-Query.ts`](../graphql/src/schemaTypes/objectTypes/gql-Query.ts) like this:

```ts
export const Query = objectType({
  definition (t) {

    // ...

    t.list.string('specs', {
      description: 'A list of specs',
      resolve: (source, args, ctx) => {
        return ctx.coreData.specs
      },
    })

    t.list.string('fooSpecs', {
      description: 'A list of specs containing foo',
      resolve: (source, args, ctx) => {
        return ctx.specs.fooSpecs()
      },
    })
  }
})
```