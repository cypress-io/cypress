import { objectType } from 'nexus'
import { BrowserFamilyEnum } from '../constants'

export const Browser = objectType({
  name: 'Browser',
  description: 'Container representing a browser',
  node: (obj) => `${obj.displayName}-${obj.version}-${obj.name}`,
  definition (t) {
    t.nonNull.string('channel')
    t.nonNull.boolean('disabled', {
      resolve: () => false,
    })

    t.nonNull.string('displayName')
    t.nonNull.field('family', {
      type: BrowserFamilyEnum,
    })

    t.string('majorVersion')
    t.nonNull.string('name')
    t.nonNull.string('path')
    t.nonNull.string('version')
  },
  sourceType: {
    module: '@packages/types',
    export: 'FoundBrowser',
  },
})

// @nxs.objectType({
//   description: 'Container representing a browser',
// })
// export class Browser implements BrowserContract {
//   constructor (private _config: BrowserContract) {}

//   @nxs.field.nonNull.string()
//   get id (): NxsResult<'Browser', 'id'> {
//     return `${this.config.name}-${this.config.version}-${this.config.displayName}`
//   }

//   @nxs.field.nonNull.string()
//   get name (): NxsResult<'Browser', 'name'> {
//     return this._config.name
//   }

//   @nxs.field.nonNull.type(() => BrowserFamilyEnum)
//   get family (): NxsResult<'Browser', 'family'> {
//     return this._config.family
//   }

//   @nxs.field.nonNull.string()
//   get channel (): NxsResult<'Browser', 'channel'> {
//     return this._config.channel
//   }

//   @nxs.field.nonNull.string()
//   get displayName (): NxsResult<'Browser', 'displayName'> {
//     return this._config.displayName
//   }

//   @nxs.field.nonNull.string()
//   get path (): NxsResult<'Browser', 'path'> {
//     return this._config.path
//   }

//   @nxs.field.nonNull.string()
//   get version (): NxsResult<'Browser', 'version'> {
//     return this._config.version
//   }

//   @nxs.field.string()
//   get majorVersion (): NxsResult<'Browser', 'majorVersion'> {
//     return this._config.majorVersion?.toString() ?? null
//   }

//   @nxs.field.nonNull.boolean()
//   get disabled (): NxsResult<'Browser', 'disabled'> {
//     return false
//   }

//   get config (): BrowserContract {
//     return this._config
//   }
// }
