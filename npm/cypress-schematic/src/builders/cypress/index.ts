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
import { from, noop, Observable, of } from 'rxjs'
import { catchError, concatMap, first, map, switchMap, tap } from 'rxjs/operators'
import { CypressBuilderOptions } from './cypressBuilderOptions'

type CypressOptions = Partial<CypressCommandLine.CypressRunOptions> &
  Partial<CypressCommandLine.CypressOpenOptions>;

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
        ? startDevServer(options.devServerTarget, options.watch, context)
        : of(options.baseUrl)
      ).pipe(
        concatMap((baseUrl: string) => initCypress({ ...options, baseUrl })),
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
    options.config = {}
  }

  if (userOptions.baseUrl) {
    options.config = { ...options.config, baseUrl: userOptions.baseUrl }
  }

  const { watch, headless } = userOptions

  return from(watch === false || headless ? run(options) : open(options)).pipe(
    map((result: any) => ({ success: !result.totalFailed && !result.failures })),
  )
}

export function startDevServer (
  devServerTarget: string,
  watch: boolean,
  context: any,
): Observable<string> {
  const overrides = {
    watch,
  }

  //@ts-ignore
  return scheduleTargetAndForget(context, targetFromTargetString(devServerTarget), overrides).pipe(
    //@ts-ignore
    map((output: any) => {
      if (!output.success && !watch) {
        throw new Error('Could not compile application files')
      }

      return output.baseUrl as string
    }),
  )
}

export default createBuilder<CypressBuilderOptions>(runCypress)
