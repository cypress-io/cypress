/* eslint-disable no-console */
import * as webpack from 'webpack'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin'

export function measureWebpackPerformance (webpackConfig: webpack.Configuration): webpack.Configuration {
  if (!process.env.WEBPACK_PERF_MEASURE) {
    throw new Error('Performance monitoring is possible only with WEBPACK_PERF_MEASURE env variable set')
  }

  const compareWithPrevious = process.env.WEBPACK_PERF_MEASURE_COMPARE

  function percentageDiff (a: number, b: number) {
    return ((a - b) / a) * 100
  }

  const compareOutput = (output: string) => {
    const statsPath = path.resolve(__dirname, '..', '__perf-stats', `${compareWithPrevious}.json`)

    if (!fs.existsSync(statsPath) || process.env.WEBPACK_PERF_MEASURE_UPDATE) {
      return fs.writeFileSync(statsPath, output, { encoding: 'utf-8' })
    }

    const newStats = JSON.parse(output)
    const oldStats = require(statsPath)
    const totalPercentageDiff = percentageDiff(oldStats.misc.compileTime, newStats.misc.compileTime)

    const printResult = (result: string) => {
      const delimiter = new Array(process.stdout.columns).fill('═').join('')

      console.log(delimiter)
      console.log(`${chalk.bold('WEBPACK_PERF_MEASURE')}`)
      console.log(`Before: ${chalk.bold(oldStats.misc.compileTime / 1000)}s`)
      console.log(`After: ${chalk.bold(newStats.misc.compileTime / 1000)}s`)
      console.log(result)
      console.log(delimiter)
    }

    if (Math.abs(totalPercentageDiff) < 5) {
      printResult('No sufficient build time difference')
    } else if (totalPercentageDiff > 0) {
      printResult(`New build is faster: ${chalk.green.bold(`+${Math.round(totalPercentageDiff)}%`)}`)
    } else {
      printResult(`New build is slower: ${chalk.red.bold(`${Math.round(totalPercentageDiff)}%`)}`)
    }
  }

  const smp = compareWithPrevious ?
    new SpeedMeasurePlugin({
      outputFormat: 'json',
      outputTarget: compareOutput,
    })
    : new SpeedMeasurePlugin()

  return smp.wrap(webpackConfig)
}
