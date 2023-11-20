/* global generateSnapshot, PATH_SEP, __pathResolver */

//
// <custom-require>
//
let require = (moduleName) => {
  throw new Error(
    `[SNAPSHOT_CACHE_FAILURE] Cannot require module "${moduleName}"`,
  )
}

/**
 * The `require` function that is used from inside the snapshot.
 * It is invoked during snapshot creation as well as while the app is running
 * and `require`s originate from inside the snapshot.
 *
 * The inline code comments explain in detail the algorithm which serves to
 * resolve a module as efficiently as possible, ideally from a snapshotted
 * export or definition and only in the worst case by falling back to the
 * Node.js module loader.
 *
 * During snapshotting for each issue it throws errors that are understood by
 * the snapshot doctor and will result in the correct resolution for the issue
 * encountered.
 *
 * @param modulePath the path to the module
 * @param modulePathFromAppRoot the path to the module relative to the app root
 * @param parentRelFilename the filename of the module importing the
 * modulePath, relative to app root
 * @param parentRelDirname the director of the module importing the modulePath,
 * relative to app root
 */
function customRequire (
  modulePath,
  modulePathFromAppRoot,
  parentRelFilename,
  parentRelDirname,
) {
  // 1. Detect if we're currently being snapshotted or if we're running the app
  const snapshotting = generateSnapshot != null

  // 2. Short circuit Node.js core modules
  if (
    !snapshotting &&
    require.builtInModules != null &&
    require.builtInModules.has(modulePath)
  ) {
    return require(modulePath)
  }

  // The relative path to the module is used to resolve modules from the various caches
  let key = modulePathFromAppRoot

  // 3. Try to determine the parent module from the `this` variable.
  //    This is a somewhat brittle attempt to resolve the parent if it is the
  //    receiver
  const loader /* NodeModule? */ =
    this != null && this !== global && this.id != null && this.filename != null
      ? this
      : undefined

  // Loaded from is used to signal to packherd how a module resolution should be counted
  let loadedFrom

  // 4. First try to resolve the fully initialized module from the cache
  let mod = key == null ? null : customRequire.exports[key]

  if (mod != null) {
    // 4.1. Try to construct the module parent from the information that we have

    // This is not very clean, but in order to create a proper module we need to
    // assume some path to base id, filename and dirname on
    if (modulePathFromAppRoot == null) {
      modulePathFromAppRoot = modulePath
    }

    // Create a parent as close as we can to what Node.js would provide
    const { parent, filename, dirname } = resolvePathsAndParent(
      snapshotting,
      modulePathFromAppRoot,
      parentRelFilename,
      parentRelDirname,
      loader,
    )

    mod.parent = parent
    mod.id = filename
    mod.filename = filename
    mod.dirname = dirname
    loadedFrom = 'exports'
  }

  // 5. Determine if we can use a cached version of the required module
  //    There are two reasons why a module cannot be used from the cache:
  //    a) it wasn't found in the cache
  //    b) it was found, but was deleted from the Node.js module cache and in
  //       order to have things work the same as without the snapshot we need to
  //       reload it
  const cannotUseCached =
    mod == null ||
    (!snapshotting &&
      typeof require.shouldBypassCache === 'function' &&
      require.shouldBypassCache(mod))

  // 6. Produce the module exports since the module wasn't found in the cache
  //    or we cannot use it
  if (cannotUseCached) {
    // Construct the module first
    if (modulePathFromAppRoot == null) {
      modulePathFromAppRoot = modulePath
    }

    // 6.1. Try our best to construct a valid parent
    const { parent, filename, dirname } = resolvePathsAndParent(
      snapshotting,
      modulePathFromAppRoot,
      parentRelFilename,
      parentRelDirname,
    )

    // 6.2. Create a module matching the Node.js module as best we can
    mod = {
      exports: {},
      children: [],
      loaded: true,
      parent,
      paths: [],
      require: customRequire,
      filename,
      id: filename,
      path: dirname,
    }

    // 6.3. populate its exports if its definition is cached
    if (customRequire.definitions.hasOwnProperty(key)) {
      customRequire.exports[key] = mod
      customRequire.definitions[key].apply(mod.exports, [
        mod.exports,
        mod,
        filename,
        dirname,
        customRequire,
      ])

      loadedFrom = 'definitions'
    } else {
      // 6.4. if it wasn't cached we need to load it via the Node.js loader
      //      which we'll do via packherd's `tryLoad` which was attached to the
      //      `require`
      if (!snapshotting) {
        loadedFrom = 'Counted already'
        const { exports, fullPath } = require._tryLoad(
          modulePath,
          parent,
          false,
        )
        // 6.5. If all went well the module should now be in the module
        //      cache, otherwise we use the module we constructed above and fill
        //      in the exports
        const cachedMod = require.cache[fullPath]

        if (cachedMod != null) {
          mod = cachedMod
        } else {
          mod.exports = exports
        }
      } else {
        // While snapshotting we load the module and add it to the exports cache
        mod.exports = require(modulePath)
        customRequire.exports[modulePath] = mod
      }
    }
  }

  // 7. Finally we need to register the module as loaded so that packherd can
  //    track which modules were loaded and how. It will also add it to the
  //    require cache in order to detect if a previously loaded module was deleted
  //    from the require cache later.
  if (typeof require.registerModuleLoad === 'function') {
    require.registerModuleLoad(mod, loadedFrom)
  }

  // 8. Return the module exports
  return mod.exports
}

customRequire.extensions = {}
customRequire.exports = {}

/**
 * Constructs a proper parent as best we can from the given information.
 *
 * It uses the `__pathResolver` which is injected into the snapshot when we
 * initialize it during app startup.
 * Since we cannot access core modules like path while shapshotting, in order
 * to join paths it uses the `PATH_SEP` which is set while snapshotting.
 *
 * @param snapshotting if `true` that means we're currently snapshotting
 * @param modulePathFromAppRoot relative module path from app root
 * @param parentRelFilename filename of parent relative to app root
 * @param parentRelDirname dirname of parent relative to app root
 * @param loader our guess at a parent Module (derived from `this`)
 * @returns {{parent: {path: string, filename: string, id: string}, filename: string, dirname: string}}
 */
function resolvePathsAndParent (
  snapshotting,
  modulePathFromAppRoot,
  parentRelFilename,
  parentRelDirname,
  loader, /* NodeModule? */
) {
  let filename; let dirname; let parentFilename; let parentDirname

  if (modulePathFromAppRoot == null) {
    throw new Error('Cannot resolve paths without modulePathFromAppRoot')
  }

  if (snapshotting || !modulePathFromAppRoot.startsWith('.')) {
    // Have to hard code / here since we can't use `path` in the snapshot
    filename = modulePathFromAppRoot.split('/').join(PATH_SEP)
    dirname = filename.split(PATH_SEP).slice(0, -1).join(PATH_SEP)
    parentFilename = parentRelFilename
    parentDirname = parentRelDirname
  } else if (modulePathFromAppRoot != null) {
    filename = __pathResolver.resolve(modulePathFromAppRoot)
    dirname = __pathResolver.resolve(
      filename.split(PATH_SEP).slice(0, -1).join(PATH_SEP),
    )

    parentFilename = __pathResolver.resolve(parentRelFilename)
    parentDirname = __pathResolver.resolve(parentRelDirname)
  }

  const parent =
    loader ??
    (parentFilename == null || parentDirname == null
      ? null
      : {
        id: parentFilename,
        filename: parentFilename,
        path: parentDirname,
      })

  return { parent, filename, dirname }
}

/**
 * Creates info object that is used when invoking `require.resolve` in order to
 * give packherd more information when resolving a module.
 *
 * @param relFilename filename or module to resolve relative to project root
 * @param relDirname dirname or module to resolve relative to project root
 * @returns { resolveOpts:
 *   { id: string,
 *     relFilename: string,
 *     relPath: string,
 *     filename: string,
 *     isResolve: boolean,
 *     fromSnapshot: boolean }
 *  }
 */
function createResolveOpts (relFilename, relDirname) {
  const filename = __pathResolver.resolve(relFilename)
  const dirname = __pathResolver.resolve(relDirname)

  return {
    id: filename,
    relFilename,
    relPath: relDirname,
    filename,
    path: dirname,
    fromSnapshot: true,
    isResolve: true,
  }
}

/**
 * Overrides `require.resolve` and is applied when a path is resolved from
 * inside the snapshot.
 * Invokes `require.resolve` with specific info that the packherd's override of
 * `require.resolve` can use to resolve the path.
 *
 * @param mod the module to resolve
 * @param relFilename filename or module to resolve relative to project root
 * @param relDirname dirname or module to resolve relative to project root
 * @returns result of invoking `require.resolve` with enhanced info
 */
customRequire.resolve = function (mod, ...args) {
  try {
    // Handle the case where args is { paths: string[] }. The module is expected to be outside of the cypress snapshot.
    if (args.length === 0 || (args[0] != null && typeof args[0] !== 'string')) {
      return require.resolve(mod, ...args)
    }

    const [relFilename = null, relDirname = null] = args
    const opts =
      relFilename != null && relDirname != null
        ? createResolveOpts(relFilename, relDirname)
        : undefined

    return require.resolve(mod, opts)
  } catch (err) {
    throw err
  }
}

//
// </custom-require>
//
