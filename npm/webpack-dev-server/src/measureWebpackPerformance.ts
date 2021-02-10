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
    return 100 * Math.abs((a - b) / ((a + b) / 2))
  }

  const compareOutput = (output: string) => {
    const outputObj = JSON.parse(output)
    const statsPath = path.resolve(__dirname, '..', '__perf-stats', `${compareWithPrevious}.json`)

    if (!fs.existsSync(statsPath) || process.env.WEBPACK_PERF_MEASURE_UPDATE) {
      return fs.writeFileSync(statsPath, output, { encoding: 'utf-8' })
    }

    const oldStats = require(statsPath)
    const totalPercentageDiff = percentageDiff(oldStats.misc.compileTime, outputObj.misc.compileTime)

    if (Math.abs(totalPercentageDiff) < 5) {
      console.log('No sufficient build time difference')
    } else if (totalPercentageDiff > 0) {
      console.log(`New build is faster: ${chalk.green(`+${Math.round(totalPercentageDiff)}%`)}`)
    } else {
      console.log(`New build is slower: ${chalk.green(`-${Math.round(totalPercentageDiff)}%`)}`)
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
