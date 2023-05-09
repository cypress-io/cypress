"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayVideoProcessingProgress = exports.displayResults = exports.renderSummaryTable = exports.maybeLogCloudRecommendationMessage = exports.displaySpecHeader = exports.displayRunStarting = exports.gray = exports.cloudRecommendationMessage = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const log_symbols_1 = tslib_1.__importDefault(require("log-symbols"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const human_interval_1 = tslib_1.__importDefault(require("human-interval"));
const root_1 = tslib_1.__importDefault(require("@packages/root"));
const human_time_1 = tslib_1.__importDefault(require("./human_time"));
const duration_1 = tslib_1.__importDefault(require("./duration"));
const newlines_1 = tslib_1.__importDefault(require("./newlines"));
const env_1 = tslib_1.__importDefault(require("./env"));
const terminal_1 = tslib_1.__importDefault(require("./terminal"));
const ci_provider_1 = require("./ci_provider");
const experiments = tslib_1.__importStar(require("../experiments"));
exports.cloudRecommendationMessage = `
  Having trouble debugging your CI failures?
  
  Record your runs to Cypress Cloud to watch video recordings for each test, 
  debug failing and flaky tests, and integrate with your favorite tools.
`;
function color(val, c) {
    return chalk_1.default[c](val);
}
function gray(val) {
    return color(val, 'gray');
}
exports.gray = gray;
function colorIf(val, c) {
    if (val === 0 || val == null) {
        val = '-';
        c = 'gray';
    }
    return color(val, c);
}
function getWidth(table, index) {
    // get the true width of a table's column,
    // based off of calculated table options for that column
    const columnWidth = table.options.colWidths[index];
    if (columnWidth) {
        return columnWidth - (table.options.style['padding-left'] + table.options.style['padding-right']);
    }
    throw new Error('Unable to get width for column');
}
function formatBrowser(browser) {
    return lodash_1.default.compact([
        browser.displayName,
        browser.majorVersion,
        browser.isHeadless && gray('(headless)'),
    ]).join(' ');
}
function formatFooterSummary(results) {
    const { totalFailed, runs } = results;
    const isCanceled = lodash_1.default.some(results.runs, { skippedSpec: true });
    // pass or fail color
    const c = isCanceled ? 'magenta' : totalFailed ? 'red' : 'green';
    const phrase = (() => {
        if (isCanceled) {
            return 'The run was canceled';
        }
        // if we have any specs failing...
        if (!totalFailed) {
            return 'All specs passed!';
        }
        // number of specs
        const total = runs.length;
        const failingRuns = lodash_1.default.filter(runs, 'stats.failures').length;
        const percent = Math.round((failingRuns / total) * 100);
        return `${failingRuns} of ${total} failed (${percent}%)`;
    })();
    return [
        isCanceled ? '-' : formatSymbolSummary(totalFailed),
        color(phrase, c),
        gray(duration_1.default.format(results.totalDuration)),
        colorIf(results.totalTests, 'reset'),
        colorIf(results.totalPassed, 'green'),
        colorIf(totalFailed, 'red'),
        colorIf(results.totalPending, 'cyan'),
        colorIf(results.totalSkipped, 'blue'),
    ];
}
function formatSymbolSummary(failures) {
    return failures ? log_symbols_1.default.error : log_symbols_1.default.success;
}
function macOSRemovePrivate(str) {
    // consistent snapshots when running system tests on macOS
    if (process.platform === 'darwin' && str.startsWith('/private')) {
        return str.slice(8);
    }
    return str;
}
function collectTestResults(obj, estimated) {
    return {
        name: lodash_1.default.get(obj, 'spec.name'),
        relativeToCommonRoot: lodash_1.default.get(obj, 'spec.relativeToCommonRoot'),
        tests: lodash_1.default.get(obj, 'stats.tests'),
        passes: lodash_1.default.get(obj, 'stats.passes'),
        pending: lodash_1.default.get(obj, 'stats.pending'),
        failures: lodash_1.default.get(obj, 'stats.failures'),
        skipped: lodash_1.default.get(obj, 'stats.skipped'),
        duration: human_time_1.default.long(lodash_1.default.get(obj, 'stats.wallClockDuration')),
        estimated: estimated && human_time_1.default.long(estimated),
        screenshots: obj.screenshots && obj.screenshots.length,
        video: Boolean(obj.video),
    };
}
function formatPath(name, n, pathColor = 'reset') {
    if (!name)
        return '';
    const fakeCwdPath = env_1.default.get('FAKE_CWD_PATH');
    if (fakeCwdPath && env_1.default.get('CYPRESS_INTERNAL_ENV') === 'test') {
        // if we're testing within Cypress, we want to strip out
        // the current working directory before calculating the stdout tables
        // this will keep our snapshots consistent everytime we run
        const cwdPath = process.cwd();
        name = name
            .split(cwdPath)
            .join(fakeCwdPath);
        name = macOSRemovePrivate(name);
    }
    // add newLines at each n char and colorize the path
    if (n) {
        let nameWithNewLines = newlines_1.default.addNewlineAtEveryNChar(name, n);
        return `${color(nameWithNewLines, pathColor)}`;
    }
    return `${color(name, pathColor)}`;
}
function formatNodeVersion({ resolvedNodeVersion, resolvedNodePath }, width) {
    if (resolvedNodePath)
        return formatPath(`v${resolvedNodeVersion} ${gray(`(${resolvedNodePath})`)}`, width);
    return;
}
function formatRecordParams(runUrl, parallel, group, tag, autoCancelAfterFailures) {
    if (runUrl) {
        return `Tag: ${tag || 'false'}, Group: ${group || 'false'}, Parallel: ${Boolean(parallel)}${autoCancelAfterFailures !== undefined ? `, Auto Cancel After Failures: ${autoCancelAfterFailures}` : ''}`;
    }
    return;
}
function displayRunStarting(options) {
    const { browser, config, group, parallel, runUrl, specPattern, specs, tag, autoCancelAfterFailures } = options;
    console.log('');
    terminal_1.default.divider('=');
    console.log('');
    terminal_1.default.header('Run Starting', {
        color: ['reset'],
    });
    console.log('');
    const experimental = experiments.getExperimentsFromResolved(config.resolved);
    const enabledExperiments = lodash_1.default.pickBy(experimental, lodash_1.default.property('enabled'));
    const hasExperiments = !process.env.CYPRESS_INTERNAL_SKIP_EXPERIMENT_LOGS && !lodash_1.default.isEmpty(enabledExperiments);
    // if we show Node Version, then increase 1st column width
    // to include wider 'Node Version:'.
    // Without Node version, need to account for possible "Experiments" label
    const colWidths = config.resolvedNodePath ? [16, 84] : (hasExperiments ? [14, 86] : [12, 88]);
    const table = terminal_1.default.table({
        colWidths,
        type: 'outsideBorder',
    });
    if (!specPattern)
        throw new Error('No specPattern in displayRunStarting');
    const formatSpecs = (specs) => {
        // 25 found: (foo.spec.js, bar.spec.js, baz.spec.js)
        const names = lodash_1.default.map(specs, 'relativeToCommonRoot');
        const specsTruncated = lodash_1.default.truncate(names.join(', '), { length: 250 });
        const stringifiedSpecs = [
            `${names.length} found `,
            '(',
            specsTruncated,
            ')',
        ]
            .join('');
        return formatPath(stringifiedSpecs, getWidth(table, 1));
    };
    const data = lodash_1.default
        .chain([
        [gray('Cypress:'), root_1.default.version],
        [gray('Browser:'), formatBrowser(browser)],
        [gray('Node Version:'), formatNodeVersion(config, getWidth(table, 1))],
        [gray('Specs:'), formatSpecs(specs)],
        [gray('Searched:'), formatPath(Array.isArray(specPattern) ? specPattern.join(', ') : String(specPattern), getWidth(table, 1))],
        [gray('Params:'), formatRecordParams(runUrl, parallel, group, tag, autoCancelAfterFailures)],
        [gray('Run URL:'), runUrl ? formatPath(runUrl, getWidth(table, 1)) : ''],
        [gray('Experiments:'), hasExperiments ? experiments.formatExperiments(enabledExperiments) : ''],
    ])
        .filter(lodash_1.default.property(1))
        .value();
    // @ts-expect-error incorrect type in Table
    table.push(...data);
    const heading = table.toString();
    console.log(heading);
    console.log('');
    return heading;
}
exports.displayRunStarting = displayRunStarting;
function displaySpecHeader(name, curr, total, estimated) {
    console.log('');
    const PADDING = 2;
    const table = terminal_1.default.table({
        colWidths: [10, 70, 20],
        colAligns: ['left', 'left', 'right'],
        type: 'pageDivider',
        style: {
            'padding-left': PADDING,
            'padding-right': 0,
        },
    });
    table.push(['', '']);
    table.push([
        'Running:',
        `${formatPath(name, getWidth(table, 1), 'gray')}`,
        gray(`(${curr} of ${total})`),
    ]);
    console.log(table.toString());
    if (estimated) {
        const estimatedLabel = `${' '.repeat(PADDING)}Estimated:`;
        return console.log(estimatedLabel, gray(human_time_1.default.long(estimated)));
    }
}
exports.displaySpecHeader = displaySpecHeader;
function maybeLogCloudRecommendationMessage(runs, record) {
    if (!(0, ci_provider_1.getIsCi)() || env_1.default.get('CYPRESS_COMMERCIAL_RECOMMENDATIONS') === '0' || record) {
        return;
    }
    if (runs.some((run) => run.stats.failures > 0)) {
        terminal_1.default.divider('-');
        console.log(exports.cloudRecommendationMessage);
        console.log(`  >>`, color('https://on.cypress.io/cloud-get-started', 'cyan'));
        console.log('');
        terminal_1.default.divider('-');
    }
}
exports.maybeLogCloudRecommendationMessage = maybeLogCloudRecommendationMessage;
function renderSummaryTable(runUrl, results) {
    const { runs } = results;
    console.log('');
    terminal_1.default.divider('=');
    console.log('');
    terminal_1.default.header('Run Finished', {
        color: ['reset'],
    });
    if (runs && runs.length) {
        const colAligns = ['left', 'left', 'right', 'right', 'right', 'right', 'right', 'right'];
        const colWidths = [3, 41, 11, 9, 9, 9, 9, 9];
        const table1 = terminal_1.default.table({
            colAligns,
            colWidths,
            type: 'noBorder',
            head: [
                '',
                gray('Spec'),
                '',
                gray('Tests'),
                gray('Passing'),
                gray('Failing'),
                gray('Pending'),
                gray('Skipped'),
            ],
        });
        const table2 = terminal_1.default.table({
            colAligns,
            colWidths,
            type: 'border',
        });
        const table3 = terminal_1.default.table({
            colAligns,
            colWidths,
            type: 'noBorder',
            head: formatFooterSummary(results),
        });
        lodash_1.default.each(runs, (run) => {
            const { spec, stats } = run;
            const ms = duration_1.default.format(stats.wallClockDuration || 0);
            const formattedSpec = formatPath(spec.relativeToCommonRoot, getWidth(table2, 1));
            if (run.skippedSpec) {
                return table2.push([
                    '-',
                    formattedSpec, color('SKIPPED', 'gray'),
                    '-', '-', '-', '-', '-',
                ]);
            }
            return table2.push([
                formatSymbolSummary(stats.failures),
                formattedSpec,
                color(ms, 'gray'),
                colorIf(stats.tests, 'reset'),
                colorIf(stats.passes, 'green'),
                colorIf(stats.failures, 'red'),
                colorIf(stats.pending, 'cyan'),
                colorIf(stats.skipped, 'blue'),
            ]);
        });
        console.log('');
        console.log('');
        console.log(terminal_1.default.renderTables(table1, table2, table3));
        console.log('');
        if (runUrl) {
            console.log('');
            const table4 = terminal_1.default.table({
                colWidths: [100],
                type: 'pageDivider',
                style: {
                    'padding-left': 2,
                },
            });
            table4.push(['', '']);
            console.log(terminal_1.default.renderTables(table4));
            console.log(`  Recorded Run: ${formatPath(runUrl, undefined, 'gray')}`);
            console.log('');
        }
    }
}
exports.renderSummaryTable = renderSummaryTable;
function displayResults(obj, estimated) {
    var _a;
    const results = collectTestResults(obj, estimated);
    const c = results.failures ? 'red' : 'green';
    console.log('');
    terminal_1.default.header('Results', {
        color: [c],
    });
    const table = terminal_1.default.table({
        colWidths: [14, 86],
        type: 'outsideBorder',
    });
    const data = lodash_1.default.chain([
        ['Tests:', results.tests],
        ['Passing:', results.passes],
        ['Failing:', results.failures],
        ['Pending:', results.pending],
        ['Skipped:', results.skipped],
        ['Screenshots:', results.screenshots],
        ['Video:', results.video],
        ['Duration:', results.duration],
        estimated ? ['Estimated:', results.estimated] : undefined,
        ['Spec Ran:', formatPath(results.relativeToCommonRoot, getWidth(table, 1), c)],
    ])
        .compact()
        .map((arr) => {
        const [key, val] = arr;
        return [color(key, 'gray'), color(val, c)];
    })
        .value();
    table.push(...data);
    console.log('');
    console.log(table.toString());
    console.log('');
    if ((_a = obj.screenshots) === null || _a === void 0 ? void 0 : _a.length)
        displayScreenshots(obj.screenshots);
}
exports.displayResults = displayResults;
function displayScreenshots(screenshots = []) {
    console.log('');
    terminal_1.default.header('Screenshots', { color: ['yellow'] });
    console.log('');
    const table = terminal_1.default.table({
        colWidths: [3, 82, 15],
        colAligns: ['left', 'left', 'right'],
        type: 'noBorder',
        style: {
            'padding-right': 0,
        },
        chars: {
            'left': ' ',
            'right': '',
        },
    });
    screenshots.forEach((screenshot) => {
        const dimensions = gray(`(${screenshot.width}x${screenshot.height})`);
        table.push([
            '-',
            formatPath(`${screenshot.path}`, getWidth(table, 1)),
            gray(dimensions),
        ]);
    });
    console.log(table.toString());
    console.log('');
}
function displayVideoProcessingProgress(opts) {
    console.log('');
    terminal_1.default.header('Video', {
        color: ['cyan'],
    });
    console.log('');
    const table = terminal_1.default.table({
        colWidths: [3, 21, 76],
        colAligns: ['left', 'left', 'left'],
        type: 'noBorder',
        style: {
            'padding-right': 0,
        },
        chars: {
            'left': ' ',
            'right': '',
        },
    });
    table.push([
        gray('-'),
        gray('Started processing:'),
        chalk_1.default.cyan(`Compressing to ${opts.videoCompression} CRF`),
    ]);
    console.log(table.toString());
    const started = Date.now();
    let progress = Date.now();
    const throttle = env_1.default.get('VIDEO_COMPRESSION_THROTTLE') || (0, human_interval_1.default)('10 seconds');
    return {
        onProgress(float) {
            if (float === 1) {
                const finished = Date.now() - started;
                const dur = `${human_time_1.default.long(finished)}`;
                const table = terminal_1.default.table({
                    colWidths: [3, 21, 61, 15],
                    colAligns: ['left', 'left', 'left', 'right'],
                    type: 'noBorder',
                    style: {
                        'padding-right': 0,
                    },
                    chars: {
                        'left': ' ',
                        'right': '',
                    },
                });
                table.push([
                    gray('-'),
                    gray('Finished processing:'),
                    gray(dur),
                ]);
                console.log(table.toString());
                console.log('');
                console.log(`  -  Video output: ${formatPath(opts.videoName, undefined, 'cyan')}`);
                console.log('');
            }
            if (Date.now() - progress > throttle) {
                // bump up the progress so we dont
                // continuously get notifications
                progress += throttle;
                const percentage = `${Math.ceil(float * 100)}%`;
                console.log('    Compression progress: ', chalk_1.default.cyan(percentage));
            }
        },
    };
}
exports.displayVideoProcessingProgress = displayVideoProcessingProgress;
