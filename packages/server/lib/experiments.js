"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKnownExperiment = exports.getExperiments = exports.getExperimentsFromResolved = exports.experimental = exports.formatExperiments = void 0;
const lodash_1 = require("lodash");
/**
 * Returns a single string with human-readable experiments.
  ```
  const experimental = getExperimentsFromResolved(config.resolved)
  const enabledExperiments = _.pickBy(experimental, (experiment) => experiment.enabled)
  formatExperiments(enabledExperiments)
  // "componentsTesting=true,featureB=false"
  ```
 */
const formatExperiments = (exp) => {
    return Object.keys(exp).map((name) => `${name}=${exp[name].value}`).join(',');
};
exports.formatExperiments = formatExperiments;
/**
 * Keeps summaries of experiments. Each summary is 1 - 2 sentences
 * describing the purpose of the experiment.
 * When adding an experiment, add its summary text here.
 *
 * @example
  ```
  {
    experimentalFetchPolyfill: 'Polyfills `window.fetch` to enable Network spying and stubbing.'
  }
  ```
*/
const _summaries = {
    experimentalFetchPolyfill: 'Polyfills `window.fetch` to enable Network spying and stubbing.',
    experimentalInteractiveRunEvents: 'Allows listening to the `before:run`, `after:run`, `before:spec`, and `after:spec` events in the plugins file during interactive mode.',
    experimentalModifyObstructiveThirdPartyCode: 'Applies `modifyObstructiveCode` to third party `.html` and `.js`, removes subresource integrity, and modifies the user agent in Electron.',
    experimentalSkipDomainInjection: 'Disables setting document.domain to the document\'s super domain on injection.',
    experimentalSourceRewriting: 'Enables AST-based JS/HTML rewriting. This may fix issues caused by the existing regex-based JS/HTML replacement algorithm.',
    experimentalSingleTabRunMode: 'Runs all component specs in a single tab, trading spec isolation for faster run mode execution.',
    experimentalStudio: 'Generate and save commands directly to your test suite by interacting with your app as an end user would.',
    experimentalWebKitSupport: 'Adds support for testing in the WebKit browser engine used by Safari. See https://on.cypress.io/webkit-experiment for more information.',
    experimentalRunAllSpecs: 'Enables the "Run All Specs" UI feature, allowing the execution of multiple specs sequentially',
    experimentalOriginDependencies: 'Enables support for `Cypress.require()` for including dependencies within the `cy.origin()` callback.',
    experimentalMemoryManagement: 'Enables support for improved memory management within Chromium-based browsers.',
};
/**
 * Keeps short names for experiments. When adding new experiments, add a short name.
 * The name and summary will be shown in the Settings tab of the Desktop GUI.
 * @example
  ```
  {
    experimentalFetchPolyfill: 'Fetch polyfill'
  }
  ```
*/
const _names = {
    experimentalFetchPolyfill: 'Fetch Polyfill',
    experimentalInteractiveRunEvents: 'Interactive Mode Run Events',
    experimentalModifyObstructiveThirdPartyCode: 'Modify Obstructive Third Party Code',
    experimentalSkipDomainInjection: 'Use Default document.domain',
    experimentalSingleTabRunMode: 'Single Tab Run Mode',
    experimentalSourceRewriting: 'Improved Source Rewriting',
    experimentalStudio: 'Studio',
    experimentalWebKitSupport: 'WebKit Support',
    experimentalRunAllSpecs: 'Run All Specs',
    experimentalOriginDependencies: 'Origin Dependencies',
    experimentalMemoryManagement: 'Memory Management',
};
/**
 * Export this object for easy stubbing from end-to-end tests.
 * If you cannot easily pass "names" and "summaries" arguments
 * to "getExperimentsFromResolved" function, then use this
 * object to change "experiments.names" and "experimental.summaries" objects.
*/
exports.experimental = {
    names: _names,
    summaries: _summaries,
};
const getExperimentsFromResolved = (resolvedConfig, names = exports.experimental.names, summaries = exports.experimental.summaries) => {
    const experiments = {};
    if (!resolvedConfig) {
        // no config - no experiments
        // this is likely to happen during unit testing
        return experiments;
    }
    const isExperimentKey = (key) => key.startsWith('experimental');
    const experimentalKeys = Object.keys(resolvedConfig).filter(isExperimentKey);
    experimentalKeys.forEach((key) => {
        const name = (0, lodash_1.get)(names, key);
        if (!name) {
            // ignore unknown experiments
            return;
        }
        const summary = (0, lodash_1.get)(summaries, key, 'top secret');
        // it would be nice to have default value in the resolved config
        experiments[key] = {
            key,
            value: resolvedConfig[key].value,
            enabled: resolvedConfig[key].from !== 'default',
            name,
            summary,
        };
    });
    return experiments;
};
exports.getExperimentsFromResolved = getExperimentsFromResolved;
/**
 * Looks at the resolved config, finds all keys that start with "experimental" prefix
 * and have non-default values and returns a simple object with {key: {value, enabled}}
 * where "on" is set to true if the value is different from default..
 */
const getExperiments = (project, names = exports.experimental.names, summaries = exports.experimental.summaries) => {
    const resolvedEnv = (0, lodash_1.get)(project, 'resolvedConfig', {});
    return (0, exports.getExperimentsFromResolved)(resolvedEnv, names, summaries);
};
exports.getExperiments = getExperiments;
/**
 * Allow known experiments here to avoid accidentally showing
 * any config key that starts with "experimental" prefix
*/
// @ts-ignore
const isKnownExperiment = (experiment, key) => {
    return Object.keys(exports.experimental.names).includes(key);
};
exports.isKnownExperiment = isKnownExperiment;
// exporting a single default object with methods
// helps make it is to stub and to test
exports.default = {
    getExperiments: exports.getExperiments,
};
