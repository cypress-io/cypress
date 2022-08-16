import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString,
} from '@angular-devkit/architect'
import { asWindowsPath, normalize } from '@angular-devkit/core'
import * as os from 'os'
import { dirname, join } from 'path'
import { open, run } from 'cypress'
import { forkJoin, from, noop, Observable, of } from 'rxjs'
import { catchError, concatMap, first, map, switchMap, tap } from 'rxjs/operators'
import { CypressBuilderOptions } from './cypressBuilderOptions'

type CypressOptions = Partial<CypressCommandLine.CypressRunOptions> &
Partial<CypressCommandLine.CypressOpenOptions>;

type StartDevServerProps = {
  devServerTarget: string
  watch?: boolean
  context: any
}

function runCypress (
  options: CypressBuilderOptions,
  context: BuilderContext,
): Observable<BuilderOutput> {
  options.env = options.env || {}

  if (options.tsConfig) {
    options.env.tsConfig = join(context.workspaceRoot, options.tsConfig)
  }

  const projectName = context.target && context.target.project || ''
  const workspace = context.getProjectMetadata(projectName)

  return from(workspace).pipe(
    map(() => os.platform() === 'win32'),
    map((isWin) => (!isWin ? normalize(context.workspaceRoot) : asWindowsPath(normalize(context.workspaceRoot)))),
    map((workspaceRoot) => {
      return {
        ...options,
        projectPath: `${workspaceRoot}/cypress`,
      }
    }),
    switchMap((options: CypressBuilderOptions) => {
      return (options.devServerTarget
        ? forkJoin(startDevServer({ devServerTarget: options.devServerTarget, watch: options.watch, context })).pipe(
          map((devServerBaseUrlArray: [string]) => options.baseUrl || devServerBaseUrlArray[0]),
        )
        : of(options.baseUrl)
      ).pipe(
        concatMap((devServerBaseUrl: string) => initCypress({ ...options, devServerBaseUrl })),
        options.watch ? tap(noop) : first(),
        catchError((error) => {
          return of({ success: false }).pipe(
            tap(() => context.reportStatus(`Error: ${error.message}`)),
            tap(() => context.logger.error(error.message)),
          )
        }),
      )
    }),
  )
}

function initCypress (userOptions: CypressBuilderOptions): Observable<BuilderOutput> {
  const projectFolderPath = dirname(userOptions.projectPath)

  const defaultOptions: CypressOptions = {
    project: projectFolderPath,
    browser: 'electron',
    headless: true,
    record: false,
    spec: '',
  }

  const options: CypressOptions = {
    ...defaultOptions,
    ...userOptions,
    //@ts-ignore
    dev: process.env.CYPRESS_ENV === 'test',
  }

  if (userOptions.configFile === undefined) {
    options.config = { e2e: { baseUrl: userOptions.devServerBaseUrl as string } }
  }

  options.config = { ...options.config }

  const { watch, headless } = userOptions

  return from(watch === false || headless ? run(options) : open(options)).pipe(
    map((result: any) => ({ success: !result.totalFailed && !result.failures })),
  )
}

export function startDevServer ({
  devServerTarget,
  watch,
  context }: StartDevServerProps): Observable<string> {
  // @NOTE: Do not forward watch option if not supported by the target dev server,
  // this is relevant for running Cypress against dev server target that does not support this option,
  // for instance @nguniversal/builders:ssr-dev-server.
  // see https://github.com/nrwl/nx/blob/f930117ed6ab13dccc40725c7e9551be081cc83d/packages/cypress/src/executors/cypress/cypress.impl.ts
  return context.getBuilderNameForTarget(targetFromTargetString(devServerTarget)).then((devServerBuilder: string) => {
    let overrides = {}

    // here we set dev server in watch mode only if it is allowed
    if (devServerBuilder !== '@nguniversal/builders:ssr-dev-server') {
      console.info(`Passing watch mode to DevServer - watch mode is ${watch}`)
      overrides = {
        watch,
      }
    }

    return scheduleTargetAndForget(context, targetFromTargetString(devServerTarget), overrides).pipe(
      map((output: any) => {
        if (!output.success && !watch) {
          throw new Error('Could not compile application files')
        }

        return output.baseUrl as string
      }),
    )
  })
}

export default createBuilder<CypressBuilderOptions>(runCypress)
