'use strict'
// @ts-check

const runAgainstExperimentDirectory = process.env.RUN_AGAINST_EXPERIMENT_DIRECTORY != null

const path = require('path')
const fs = require('fs').promises

const { SnapshotGenerator, prettyPrintError } = require('v8-snapshot')

const debug = require('debug')
const logInfo = debug('snapgen:info')
const logDebug = debug('snapgen:debug')

/*
 * Tries to resolve results from the previous step for the given environment.
 * Returns empty object if resolution failed.
 */
function resolvePrevious ({ snapshotMetaPrevFile }) {
  try {
    const {
      norewrite: previousNoRewrite,
      deferred: previousDeferred,
      healthy: previousHealthy,
    } = require(snapshotMetaPrevFile)

    return { previousNoRewrite, previousDeferred, previousHealthy }
  } catch (_) {
    return {}
  }
}

function getSnapshotGenerator ({
  nodeModulesOnly,
  projectBaseDir,
  snapshotCacheDir,
  mksnapshotBin,
  snapshotEntryFile,
  snapshotMetaPrevFile,
  usePreviousSnapshotMetadata,
  resolverMap,
}) {
  const {
    previousNoRewrite,
    previousDeferred,
    previousHealthy,
  } = usePreviousSnapshotMetadata
    ? resolvePrevious({
      snapshotMetaPrevFile,
    })
    : {}

  return new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
    cacheDir: snapshotCacheDir,
    mksnapshotBin,
    previousDeferred,
    previousHealthy,
    previousNoRewrite,
    minify: false,
    nodeModulesOnly,
    resolverMap,
    forceNoRewrite: [
      // recursion due to process.emit overwrites which is incorrectly rewritten
      'signal-exit/index.js',
      // recursion due to process.{chdir,cwd} overwrites which are incorrectly rewritten
      'graceful-fs/polyfills.js',

      // wx is rewritten to __get_wx__ but not available for Node.js > 0.6
      'lockfile/lockfile.js',
      // rewrites dns.lookup which conflicts with our rewrite
      'evil-dns/evil-dns.js',

      // `address instanceof (__get_URL2__())` -- right hand side not an object
      // even though function is in scope
      'ws/lib/websocket.js',

      // defers PassThroughStream which is then not accepted as a constructor
      'get-stream/buffer-stream.js',

      // deferring should be fine as it just reexports `process` which in the
      // case of cache is the stub
      'process-nextick-args/index.js',

      //
      // Only needed when including app files
      //

      // resuls in recursive call to __get_fs2__
      'packages/https-proxy/lib/ca.js',

      'node_modules/nexus/dist/index.js',
      'node_modules/nexus/dist/core.js',
      'node_modules/nexus/dist/definitions/list.js',
      'node_modules/nexus/dist/definitions/nexusMeta.js',
      'node_modules/nexus/dist/definitions/nonNull.js',
      'node_modules/nexus/dist/definitions/nullable.js',
      'node_modules/nexus/dist/definitions/wrapping.js',
      'node_modules/nexus/dist/index.js',
      'node_modules/nexus/dist/plugins/declarativeWrappingPlugin.js',
      'node_modules/nexus/dist/typegenAutoConfig.js',
      'node_modules/nexus/dist/typegenFormatPrettier.js',
      'node_modules/nexus/dist/typegenMetadata.js',
      'node_modules/nexus/dist/typegenUtils.js',
      'node_modules/nexus/dist/utils.js',
      'node_modules/graphql-scalars/index.js',
      'node_modules/graphql-ws/lib/common.js',
      'node_modules/graphql-ws/lib/server.js',
      'node_modules/graphql-ws/lib/use/ws.js',
      'node_modules/graphql-ws/lib/utils.js',
      'node_modules/graphql/error/GraphQLError.js',
      'node_modules/graphql/error/formatError.js',
      'node_modules/graphql/error/index.js',
      'node_modules/graphql/error/locatedError.js',
      'node_modules/graphql/error/syntaxError.js',
      'node_modules/graphql/execution/execute.js',
      'node_modules/graphql/execution/index.js',
      'node_modules/graphql/execution/values.js',
      'node_modules/graphql/graphql.js',
      'node_modules/graphql/index.js',
      'node_modules/graphql/jsutils/Path.js',
      'node_modules/graphql/jsutils/defineInspect.js',
      'node_modules/graphql/jsutils/devAssert.js',
      'node_modules/graphql/jsutils/didYouMean.js',
      'node_modules/graphql/jsutils/identityFunc.js',
      'node_modules/graphql/jsutils/inspect.js',
      'node_modules/graphql/jsutils/instanceOf.js',
      'node_modules/graphql/jsutils/invariant.js',
      'node_modules/graphql/jsutils/isAsyncIterable.js',
      'node_modules/graphql/jsutils/isObjectLike.js',
      'node_modules/graphql/jsutils/isPromise.js',
      'node_modules/graphql/jsutils/keyMap.js',
      'node_modules/graphql/jsutils/keyValMap.js',
      'node_modules/graphql/jsutils/mapValue.js',
      'node_modules/graphql/jsutils/memoize3.js',
      'node_modules/graphql/jsutils/naturalCompare.js',
      'node_modules/graphql/jsutils/nodejsCustomInspectSymbol.js',
      'node_modules/graphql/jsutils/printPathArray.js',
      'node_modules/graphql/jsutils/promiseForObject.js',
      'node_modules/graphql/jsutils/promiseReduce.js',
      'node_modules/graphql/jsutils/safeArrayFrom.js',
      'node_modules/graphql/jsutils/suggestionList.js',
      'node_modules/graphql/jsutils/toObjMap.js',
      'node_modules/graphql/language/ast.js',
      'node_modules/graphql/language/blockString.js',
      'node_modules/graphql/language/directiveLocation.js',
      'node_modules/graphql/language/index.js',
      'node_modules/graphql/language/kinds.js',
      'node_modules/graphql/language/lexer.js',
      'node_modules/graphql/language/location.js',
      'node_modules/graphql/language/parser.js',
      'node_modules/graphql/language/predicates.js',
      'node_modules/graphql/language/printLocation.js',
      'node_modules/graphql/language/printer.js',
      'node_modules/graphql/language/source.js',
      'node_modules/graphql/language/tokenKind.js',
      'node_modules/graphql/language/visitor.js',
      'node_modules/graphql/polyfills/arrayFrom.js',
      'node_modules/graphql/polyfills/find.js',
      'node_modules/graphql/polyfills/isFinite.js',
      'node_modules/graphql/polyfills/isInteger.js',
      'node_modules/graphql/polyfills/objectEntries.js',
      'node_modules/graphql/polyfills/objectValues.js',
      'node_modules/graphql/polyfills/symbols.js',
      'node_modules/graphql/subscription/index.js',
      'node_modules/graphql/subscription/mapAsyncIterator.js',
      'node_modules/graphql/subscription/subscribe.js',
      'node_modules/graphql/type/definition.js',
      'node_modules/graphql/type/directives.js',
      'node_modules/graphql/type/index.js',
      'node_modules/graphql/type/introspection.js',
      'node_modules/graphql/type/scalars.js',
      'node_modules/graphql/type/schema.js',
      'node_modules/graphql/type/validate.js',
      'node_modules/graphql/utilities/TypeInfo.js',
      'node_modules/graphql/utilities/assertValidName.js',
      'node_modules/graphql/utilities/astFromValue.js',
      'node_modules/graphql/utilities/buildASTSchema.js',
      'node_modules/graphql/utilities/buildClientSchema.js',
      'node_modules/graphql/utilities/coerceInputValue.js',
      'node_modules/graphql/utilities/concatAST.js',
      'node_modules/graphql/utilities/extendSchema.js',
      'node_modules/graphql/utilities/findBreakingChanges.js',
      'node_modules/graphql/utilities/findDeprecatedUsages.js',
      'node_modules/graphql/utilities/getIntrospectionQuery.js',
      'node_modules/graphql/utilities/getOperationAST.js',
      'node_modules/graphql/utilities/getOperationRootType.js',
      'node_modules/graphql/utilities/index.js',
      'node_modules/graphql/utilities/introspectionFromSchema.js',
      'node_modules/graphql/utilities/lexicographicSortSchema.js',
      'node_modules/graphql/utilities/printSchema.js',
      'node_modules/graphql/utilities/separateOperations.js',
      'node_modules/graphql/utilities/stripIgnoredCharacters.js',
      'node_modules/graphql/utilities/typeComparators.js',
      'node_modules/graphql/utilities/typeFromAST.js',
      'node_modules/graphql/utilities/valueFromAST.js',
      'node_modules/graphql/utilities/valueFromASTUntyped.js',
      'node_modules/graphql/validation/ValidationContext.js',
      'node_modules/graphql/validation/index.js',
      'node_modules/graphql/validation/rules/ExecutableDefinitionsRule.js',
      'node_modules/graphql/validation/rules/FieldsOnCorrectTypeRule.js',
      'node_modules/graphql/validation/rules/FragmentsOnCompositeTypesRule.js',
      'node_modules/graphql/validation/rules/KnownArgumentNamesRule.js',
      'node_modules/graphql/validation/rules/KnownDirectivesRule.js',
      'node_modules/graphql/validation/rules/KnownFragmentNamesRule.js',
      'node_modules/graphql/validation/rules/KnownTypeNamesRule.js',
      'node_modules/graphql/validation/rules/LoneAnonymousOperationRule.js',
      'node_modules/graphql/validation/rules/LoneSchemaDefinitionRule.js',
      'node_modules/graphql/validation/rules/NoFragmentCyclesRule.js',
      'node_modules/graphql/validation/rules/NoUndefinedVariablesRule.js',
      'node_modules/graphql/validation/rules/NoUnusedFragmentsRule.js',
      'node_modules/graphql/validation/rules/NoUnusedVariablesRule.js',
      'node_modules/graphql/validation/rules/OverlappingFieldsCanBeMergedRule.js',
      'node_modules/graphql/validation/rules/PossibleFragmentSpreadsRule.js',
      'node_modules/graphql/validation/rules/PossibleTypeExtensionsRule.js',
      'node_modules/graphql/validation/rules/ProvidedRequiredArgumentsRule.js',
      'node_modules/graphql/validation/rules/ScalarLeafsRule.js',
      'node_modules/graphql/validation/rules/SingleFieldSubscriptionsRule.js',
      'node_modules/graphql/validation/rules/UniqueArgumentNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueDirectiveNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueDirectivesPerLocationRule.js',
      'node_modules/graphql/validation/rules/UniqueEnumValueNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueFieldDefinitionNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueFragmentNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueInputFieldNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueOperationNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueOperationTypesRule.js',
      'node_modules/graphql/validation/rules/UniqueTypeNamesRule.js',
      'node_modules/graphql/validation/rules/UniqueVariableNamesRule.js',
      'node_modules/graphql/validation/rules/ValuesOfCorrectTypeRule.js',
      'node_modules/graphql/validation/rules/VariablesAreInputTypesRule.js',
      'node_modules/graphql/validation/rules/VariablesInAllowedPositionRule.js',
      'node_modules/graphql/validation/rules/custom/NoDeprecatedCustomRule.js',
      'node_modules/graphql/validation/rules/custom/NoSchemaIntrospectionCustomRule.js',
      'node_modules/graphql/validation/specifiedRules.js',
      'node_modules/graphql/validation/validate.js',
      'node_modules/graphql/version.js',
      'node_modules/nexus/dist/blocks.js',
      'node_modules/nexus/dist/builder.js',
      'node_modules/nexus/dist/definitions/_types.js',
      'node_modules/nexus/dist/definitions/args.js',
      'node_modules/nexus/dist/definitions/decorateType.js',
      'node_modules/nexus/dist/definitions/definitionBlocks.js',
      'node_modules/nexus/dist/definitions/enumType.js',
      'node_modules/nexus/dist/definitions/extendInputType.js',
      'node_modules/nexus/dist/definitions/extendType.js',
      'node_modules/nexus/dist/definitions/inputObjectType.js',
      'node_modules/nexus/dist/definitions/interfaceType.js',
      'node_modules/nexus/dist/definitions/mutationField.js',
      'node_modules/nexus/dist/definitions/mutationType.js',
      'node_modules/nexus/dist/definitions/objectType.js',
      'node_modules/nexus/dist/definitions/queryField.js',
      'node_modules/nexus/dist/definitions/queryType.js',
      'node_modules/nexus/dist/definitions/scalarType.js',
      'node_modules/nexus/dist/definitions/subscriptionField.js',
      'node_modules/nexus/dist/definitions/subscriptionType.js',
      'node_modules/nexus/dist/definitions/unionType.js',
      'node_modules/nexus/dist/dynamicMethod.js',
      'node_modules/nexus/dist/dynamicProperty.js',
      'node_modules/nexus/dist/extensions.js',
      'node_modules/nexus/dist/lang.js',
      'node_modules/nexus/dist/makeSchema.js',
      'node_modules/nexus/dist/messages.js',
      'node_modules/nexus/dist/plugin.js',
      'node_modules/nexus/dist/plugins/fieldAuthorizePlugin.js',
      'node_modules/nexus/dist/plugins/nullabilityGuardPlugin.js',
      'node_modules/nexus/dist/plugins/queryComplexityPlugin.js',
      'node_modules/nexus/dist/rebuildType.js',
      'node_modules/nexus/dist/sdlConverter.js',
      'node_modules/nexus/dist/typegenPrinter.js',
      'node_modules/nexus/dist/typegenTypeHelpers.js',
      'node_modules/nexus/package.json',
      'packages/graphql/index.js',
      'packages/graphql/node_modules/chalk/node_modules/supports-color/index.js',
      'packages/graphql/node_modules/chalk/source/index.js',
      'packages/graphql/node_modules/debug/src/browser.js',
      'packages/graphql/node_modules/debug/src/index.js',
      'packages/graphql/node_modules/supports-color/index.js',
      'packages/graphql/node_modules/ws/index.js',
      'packages/graphql/node_modules/ws/lib/constants.js',
      'packages/graphql/node_modules/ws/lib/receiver.js',
      'packages/graphql/node_modules/ws/lib/websocket-server.js',
      'packages/graphql/node_modules/ws/lib/websocket.js',
      'packages/graphql/src/makeGraphQLServer.ts',
      'packages/graphql/src/plugins/index.ts',
      'packages/graphql/src/plugins/nexusDebugFieldPlugin.ts',
      'packages/graphql/src/plugins/nexusDeferIfNotLoadedPlugin.ts',
      'packages/graphql/src/plugins/nexusMutationErrorPlugin.ts',
      'packages/graphql/src/plugins/nexusNodePlugin.ts',
      'packages/graphql/src/plugins/nexusSlowGuardPlugin.ts',
      'packages/graphql/src/schema.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-BrowserFamilyEnum.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-BrowserStatus.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-CodeGenTypeEnum.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-ErrorTypeEnum.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-FileExtensionEnum.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-ProjectEnums.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-SpecEnum.ts',
      'packages/graphql/src/schemaTypes/enumTypes/gql-WizardEnums.ts',
      'packages/graphql/src/schemaTypes/enumTypes/index.ts',
      'packages/graphql/src/schemaTypes/index.ts',
      'packages/graphql/src/schemaTypes/inputTypes/gql-FileDetailsInput.ts',
      'packages/graphql/src/schemaTypes/inputTypes/gql-WizardUpdateInput.ts',
      'packages/graphql/src/schemaTypes/inputTypes/index.ts',
      'packages/graphql/src/schemaTypes/interfaceTypes/gql-ProjectLike.ts',
      'packages/graphql/src/schemaTypes/interfaceTypes/index.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-AuthState.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Browser.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-CachedUser.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-CodeFrame.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-CurrentProject.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-DevState.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Editor.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-ErrorWrapper.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-FileParts.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-GenerateSpecResponse.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-GeneratedSpecError.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-GitInfo.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-GlobalProject.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-LocalSettings.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Migration.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Mutation.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-ProjectPreferences.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Query.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-ScaffoldedFile.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Spec.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Subscription.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-TestingTypeInfo.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Version.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-VersionData.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-Wizard.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-WizardBundler.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-WizardFrontendFramework.ts',
      'packages/graphql/src/schemaTypes/objectTypes/gql-WizardNpmPackage.ts',
      'packages/graphql/src/schemaTypes/objectTypes/index.ts',
      'packages/graphql/src/schemaTypes/scalarTypes/gql-customScalars.ts',
      'packages/graphql/src/schemaTypes/scalarTypes/index.ts',
      'packages/graphql/src/schemaTypes/unions/gql-GeneratedSpecResult.ts',
      'packages/graphql/src/schemaTypes/unions/index.ts',
      'packages/graphql/src/stitching/remoteSchema.ts',
      'packages/graphql/src/stitching/remoteSchemaWrapped.ts',
      // 'node_modules/@babel/types/lib/definitions/jsx.js',
      // 'node_modules/@babel/types/lib/validators/is.js',
      // 'node_modules/@babel/types/lib/definitions/experimental.js',
      // 'node_modules/@babel/types/lib/definitions/placeholders.js',
      // 'node_modules/@babel/types/lib/definitions/misc.js',
      // 'node_modules/@babel/types/lib/definitions/typescript.js',
      // 'node_modules/@babel/types/lib/definitions/flow.js',
      // 'node_modules/@babel/types/lib/definitions/utils.js',
      // 'node_modules/@babel/types/lib/definitions/core.js',
      // 'node_modules/chrome-remote-interface/index.js',
      // '../../../../node_modules/@cypress/commit-info/node_modules/ms/index.js',
      // '../../../../node_modules/@cypress/get-windows-proxy/node_modules/ms/index.js',
      // '../../../../node_modules/@cypress/icons/index.js',
      // '../../../../node_modules/@cypress/icons/lib/icons.js',
    ],
  })
}

/**
 * Generates and installs the snapshot.
 *
 * Assumes that the snapshot entry file has been generated, see ./gen-entry.js.
 * Assumes that the snapshot meta file has been generated, see ./gen-meta.js.
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
module.exports = async function installSnapshot (
  {
    cypressAppSnapshotDir,
    nodeModulesOnly,
    projectBaseDir,
    snapshotCacheDir,
    mksnapshotBin,
    snapshotEntryFile,
    snapshotMetaFile,
    snapshotMetaPrevFile,
    usePreviousSnapshotMetadata,
  },
  resolverMap,
) {
  try {
    logInfo('Generating snapshot %o', {
      nodeModulesOnly,
      usePreviousSnapshotMetadata,
    })

    const snapshotGenerator = getSnapshotGenerator({
      nodeModulesOnly,
      projectBaseDir,
      snapshotCacheDir,
      mksnapshotBin,
      snapshotEntryFile,
      snapshotMetaFile,
      snapshotMetaPrevFile,
      usePreviousSnapshotMetadata,
      resolverMap,
    })

    await snapshotGenerator.createScript()
    const { v8ContextFile } = await snapshotGenerator.makeSnapshot()

    if (!runAgainstExperimentDirectory) {
      const cypressAppSnapshotFile = path.join(
        cypressAppSnapshotDir,
        v8ContextFile,
      )

      // TODO(thlorenz): should we remove it or keep it for inspection, i.e. to verify it updated?
      await fs.copyFile(
        path.join(projectBaseDir, v8ContextFile),
        cypressAppSnapshotFile,
      )

      logDebug('Copied snapshot to "%s"', cypressAppSnapshotFile)
    } else {
      snapshotGenerator.installSnapshot()
    }

    logInfo('Done generating snapshot')
  } catch (err) {
    prettyPrintError(err, projectBaseDir)
    throw err
  }
}
