/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _          = require("lodash");
const os         = require("os");
const la         = require("lazy-ass");
const chalk      = require("chalk");
const check      = require("check-more-types");
const debug      = require("debug")("cypress:server:record");
const Promise    = require("bluebird");
const isForkPr   = require("is-fork-pr");
const commitInfo = require("@cypress/commit-info");
const api        = require("../api");
const logger     = require("../logger");
const errors     = require("../errors");
const capture    = require("../capture");
const upload     = require("../upload");
const env        = require("../util/env");
const keys       = require("../util/keys");
const terminal   = require("../util/terminal");
const humanTime  = require("../util/human_time");
const ciProvider = require("../util/ci_provider");
const settings   = require("../util/settings");

const onBeforeRetry = details =>
  errors.warning(
    "DASHBOARD_API_RESPONSE_FAILED_RETRYING", {
      delay: humanTime.long(details.delay, false),
      tries: details.total - details.retryIndex,
      response: details.err
    }
  )
;

const logException = err =>
  //# give us up to 1 second to
  //# create this exception report
  logger.createException(err)
  .timeout(1000)
  .catch(function() {})
;
    //# dont yell about any errors either

const runningInternalTests = () => env.get("CYPRESS_INTERNAL_E2E_TESTS") === "1";

const warnIfCiFlag = function(ci) {
  //# if we are using the ci flag that means
  //# we have an old version of the CLI tools installed
  //# and that we need to warn the user what to update
  if (ci) {
    const type = (() => { switch (false) {
      case !env.get("CYPRESS_CI_KEY"):
        return "CYPRESS_CI_DEPRECATED_ENV_VAR";
      default:
        return "CYPRESS_CI_DEPRECATED";
    } })();

    return errors.warning(type);
  }
};

const haveProjectIdAndKeyButNoRecordOption = (projectId, options) =>
  //# if we have a project id
  //# and we have a key
  //# and (record or ci) hasn't been set to true or false
  (projectId && options.key) && (
    _.isUndefined(options.record) && _.isUndefined(options.ci)
  )
;

const warnIfProjectIdButNoRecordOption = function(projectId, options) {
  if (haveProjectIdAndKeyButNoRecordOption(projectId, options)) {
    //# log a warning telling the user
    //# that they either need to provide us
    //# with a RECORD_KEY or turn off
    //# record mode
    return errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId);
  }
};

const throwIfIndeterminateCiBuildId = function(ciBuildId, parallel, group) {
  if ((!ciBuildId && !ciProvider.provider()) && (parallel || group)) {
    return errors.throw(
      "INDETERMINATE_CI_BUILD_ID",
      {
        group,
        parallel
      },
      ciProvider.detectableCiBuildIdProviders()
    );
  }
};

const throwIfRecordParamsWithoutRecording = function(record, ciBuildId, parallel, group, tag) {
  if (!record && _.some([ciBuildId, parallel, group, tag])) {
    return errors.throw("RECORD_PARAMS_WITHOUT_RECORDING", {
      ciBuildId,
      tag,
      group,
      parallel
    });
  }
};

const throwIfIncorrectCiBuildIdUsage = function(ciBuildId, parallel, group) {
  //# we've been given an explicit ciBuildId
  //# but no parallel or group flag
  if (ciBuildId && (!parallel && !group)) {
    return errors.throw("INCORRECT_CI_BUILD_ID_USAGE", { ciBuildId });
  }
};

const throwIfNoProjectId = function(projectId, configFile) {
  if (!projectId) {
    return errors.throw("CANNOT_RECORD_NO_PROJECT_ID", configFile);
  }
};

const getSpecRelativePath = spec => _.get(spec, "relative", null);

const uploadArtifacts = function(options = {}) {
  const { video, screenshots, videoUploadUrl, shouldUploadVideo, screenshotUploadUrls } = options;

  const uploads = [];
  let count   = 0;

  const nums = function() {
    count += 1;

    return chalk.gray(`(${count}/${uploads.length})`);
  };

  const send = function(pathToFile, url) {
    const success = () => console.log(`  - Done Uploading ${nums()}`, chalk.blue(pathToFile));

    const fail = function(err) {
      debug("failed to upload artifact %o", {
        file: pathToFile,
        stack: err.stack
      });

      return console.log(`  - Failed Uploading ${nums()}`, chalk.red(pathToFile));
    };

    return uploads.push(
      upload.send(pathToFile, url)
      .then(success)
      .catch(fail)
    );
  };

  if (videoUploadUrl && shouldUploadVideo) {
    send(video, videoUploadUrl);
  }

  if (screenshotUploadUrls) {
    screenshotUploadUrls.forEach(function(obj) {
      const screenshot = _.find(screenshots, { screenshotId: obj.screenshotId });

      return send(screenshot.path, obj.uploadUrl);
    });
  }

  if (!uploads.length) {
    console.log("  - Nothing to Upload");
  }

  return Promise
  .all(uploads)
  .catch(function(err) {
    errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err);

    return logException(err);
  });
};

const updateInstanceStdout = function(options = {}) {
  const { instanceId, captured } = options;

  const stdout = captured.toString();

  const makeRequest = () =>
    api.updateInstanceStdout({
      stdout,
      instanceId
    })
  ;

  return api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch(function(err) {
    debug("failed updating instance stdout %o", {
      stack: err.stack
    });

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);

    //# dont log exceptions if we have a 503 status code
    if (err.statusCode !== 503) { return logException(err); }}).finally(capture.restore);
};

const updateInstance = function(options = {}) {
  const { instanceId, results, captured, group, parallel, ciBuildId } = options;
  let { stats, tests, hooks, video, screenshots, reporterStats, error } = results;

  video = Boolean(video);
  const cypressConfig = options.config;
  const stdout = captured.toString();

  //# get rid of the path property
  screenshots = _.map(screenshots, screenshot => _.omit(screenshot, "path"));

  const makeRequest = () =>
    api.updateInstance({
      stats,
      tests,
      error,
      video,
      hooks,
      stdout,
      instanceId,
      screenshots,
      reporterStats,
      cypressConfig
    })
  ;

  return api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch(function(err) {
    debug("failed updating instance %o", {
      stack: err.stack
    });

    if (parallel) {
      return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
        response: err,
        flags: {
          group,
          ciBuildId,
        },
      });
    }

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);

    //# dont log exceptions if we have a 503 status code
    if (err.statusCode !== 503) {
      return logException(err)
      .return(null);
    } else {
      return null;
    }
  });
};

const getCommitFromGitOrCi = function(git) {
  la(check.object(git), 'expected git information object', git);
  return ciProvider.commitDefaults({
    sha: git.sha,
    branch: git.branch,
    authorName: git.author,
    authorEmail: git.email,
    message: git.message,
    remoteOrigin: git.remote,
    defaultBranch: null
  });
};

const usedTestsMessage = function(limit, phrase) {
  if (_.isFinite(limit)) {
    return `The limit is ${chalk.blue(limit)} ${phrase} recordings.`;
  } else {
    return "";
  }
};

const billingLink = function(orgId) {
  if (orgId) {
    return `https://on.cypress.io/dashboard/organizations/${orgId}/billing`;
  } else {
    return "https://on.cypress.io/set-up-billing";
  }
};

const gracePeriodMessage = gracePeriodEnds => gracePeriodEnds || "the grace period ends";

const createRun = Promise.method(function(options = {}) {
  _.defaults(options, {
    group: null,
    tags: null,
    parallel: null,
    ciBuildId: null,
  });

  let { projectId, recordKey, platform, git, specPattern, specs, parallel, ciBuildId, group, tags } = options;

  if (recordKey == null) { recordKey = env.get("CYPRESS_RECORD_KEY") || env.get("CYPRESS_CI_KEY"); }

  if (!recordKey) {
    //# are we a forked pull request (forked PR) and are we NOT running our own internal
    //# e2e tests? currently some e2e tests fail when a user submits
    //# a PR because this logic triggers unintended here
    if (isForkPr.isForkPr() && !runningInternalTests()) {
      //# bail with a warning
      return errors.warning("RECORDING_FROM_FORK_PR");
    }

    //# else throw
    errors.throw("RECORD_KEY_MISSING");
  }

  //# go back to being a string
  if (specPattern) {
    specPattern = specPattern.join(",");
  }

  if (ciBuildId) {
    //# stringify
    ciBuildId = String(ciBuildId);
  }

  specs = _.map(specs, getSpecRelativePath);

  const commit = getCommitFromGitOrCi(git);
  debug("commit information from Git or from environment variables");
  debug(commit);

  const makeRequest = () =>
    api.createRun({
      specs,
      group,
      tags,
      parallel,
      platform,
      ciBuildId,
      projectId,
      recordKey,
      specPattern,
      ci: {
        params: ciProvider.ciParams(),
        provider: ciProvider.provider()
      },
      commit
    })
  ;

  return api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .tap(function(response) {
    if (!__guard__(response != null ? response.warnings : undefined, x => x.length)) { return; }

    return _.each(response.warnings, function(warning) {
      switch (warning.code) {
        case "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS":
          return errors.warning("FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "private test"),
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
            link: billingLink(warning.orgId)
          });
        case "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS":
          return errors.warning("FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "test"),
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
            link: billingLink(warning.orgId)
          });
        case "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE":
          return errors.warning("FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE", {
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
            link: billingLink(warning.orgId)
          });
        case "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
          return errors.warning("PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "private test"),
            link: billingLink(warning.orgId)
          });
        case "PAID_PLAN_EXCEEDS_MONTHLY_TESTS":
          return errors.warning("PAID_PLAN_EXCEEDS_MONTHLY_TESTS", {
            usedTestsMessage: usedTestsMessage(warning.limit, "test"),
            link: billingLink(warning.orgId)
          });
        case "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED":
          return errors.warning("PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED", {
            gracePeriodMessage: gracePeriodMessage(warning.gracePeriodEnds),
            link: billingLink(warning.orgId)
          });
        default:
          return errors.warning("DASHBOARD_UNKNOWN_CREATE_RUN_WARNING", {
            message: warning.message,
            props: _.omit(warning, 'message')
          });
      }
    });}).catch(function(err) {
    debug("failed creating run %o", {
      stack: err.stack
    });

    switch (err.statusCode) {
      case 401:
        recordKey = keys.hide(recordKey);
        return errors.throw("DASHBOARD_RECORD_KEY_NOT_VALID", recordKey, projectId);
      case 402:
        var { code, payload } = err.error;

        var limit = _.get(payload, "limit");
        var orgId = _.get(payload, "orgId");

        switch (code) {
          case "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS":
            return errors.throw("FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS", {
              usedTestsMessage: usedTestsMessage(limit, "private test"),
              link: billingLink(orgId)
            });
          case "FREE_PLAN_EXCEEDS_MONTHLY_TESTS":
            return errors.throw("FREE_PLAN_EXCEEDS_MONTHLY_TESTS", {
              usedTestsMessage: usedTestsMessage(limit, "test"),
              link: billingLink(orgId)
            });
          case "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN":
            return errors.throw("PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN", {
              link: billingLink(orgId)
            });
          case "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN":
            return errors.throw("RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN", {
              link: billingLink(orgId)
            });
          default:
            return errors.throw("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
              response: err,
              flags: {
                group,
                tags,
                parallel,
                ciBuildId,
              },
            });
        }
      case 404:
        return errors.throw("DASHBOARD_PROJECT_NOT_FOUND", projectId, settings.configFile(options));
      case 412:
        return errors.throw("DASHBOARD_INVALID_RUN_REQUEST", err.error);
      case 422:
        ({ code, payload } = err.error);

        var runUrl = _.get(payload, "runUrl");

        switch (code) {
          case "RUN_GROUP_NAME_NOT_UNIQUE":
            return errors.throw("DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE", {
              group,
              runUrl,
              ciBuildId,
            });
          case "PARALLEL_GROUP_PARAMS_MISMATCH":
            var { browserName, browserVersion, osName, osVersion } = platform;

            return errors.throw("DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH", {
              group,
              runUrl,
              ciBuildId,
              parameters: {
                osName,
                osVersion,
                browserName,
                browserVersion,
                specs,
              }
            });
          case "PARALLEL_DISALLOWED":
            return errors.throw("DASHBOARD_PARALLEL_DISALLOWED", {
              tags,
              group,
              runUrl,
              ciBuildId,
            });
          case "PARALLEL_REQUIRED":
            return errors.throw("DASHBOARD_PARALLEL_REQUIRED", {
              tags,
              group,
              runUrl,
              ciBuildId,
            });
          case "ALREADY_COMPLETE":
            return errors.throw("DASHBOARD_ALREADY_COMPLETE", {
              runUrl,
              tags,
              group,
              parallel,
              ciBuildId,
            });
          case "STALE_RUN":
            return errors.throw("DASHBOARD_STALE_RUN", {
              runUrl,
              tags,
              group,
              parallel,
              ciBuildId,
            });
          default:
            return errors.throw("DASHBOARD_UNKNOWN_INVALID_REQUEST", {
              response: err,
              flags: {
                tags,
                group,
                parallel,
                ciBuildId,
              },
            });
        }
      default:
        if (parallel) {
          return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
            response: err,
            flags: {
              group,
              ciBuildId,
            },
          });
        }

        //# warn the user that assets will be not recorded
        errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);

        //# report on this exception
        //# and return null
        return logException(err)
        .return(null);
    }
  });
});

const createInstance = function(options = {}) {
  let { runId, group, groupId, parallel, machineId, ciBuildId, platform, spec } = options;

  spec = getSpecRelativePath(spec);

  const makeRequest = () =>
    api.createInstance({
      spec,
      runId,
      groupId,
      platform,
      machineId
    })
  ;

  return api.retryWithBackoff(makeRequest, { onBeforeRetry })
  .catch(function(err) {
    debug("failed creating instance %o", {
      stack: err.stack
    });

    if (parallel) {
      return errors.throw("DASHBOARD_CANNOT_PROCEED_IN_PARALLEL", {
        response: err,
        flags: {
          group,
          ciBuildId,
        },
      });
    }

    errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);

    //# dont log exceptions if we have a 503 status code
    if (err.statusCode !== 503) {
      return logException(err)
      .return(null);
    } else {
      return null;
    }
  });
};

const createRunAndRecordSpecs = function(options = {}) {
  const { specPattern, specs, sys, browser, projectId, projectRoot, runAllSpecs, parallel, ciBuildId, group } = options;
  const recordKey = options.key;

  // we want to normalize this to an array to send to API
  const tags = _.split(options.tag, ',');

  return commitInfo.commitInfo(projectRoot)
  .then(function(git) {
    debug("found the following git information");
    debug(git);

    const platform = {
      osCpus: sys.osCpus,
      osName: sys.osName,
      osMemory: sys.osMemory,
      osVersion: sys.osVersion,
      browserName: browser.displayName,
      browserVersion: browser.version
    };

    return createRun({
      git,
      specs,
      group,
      tags,
      parallel,
      platform,
      recordKey,
      ciBuildId,
      projectId,
      specPattern
    })
    .then(function(resp) {
      if (!resp) {
        //# if a forked run, can't record and can't be parallel
        //# because the necessary env variables aren't present
        return runAllSpecs({
          parallel: false
        });
      } else {
        const { runUrl, runId, machineId, groupId } = resp;

        let captured = null;
        let instanceId = null;

        const beforeSpecRun = function(spec) {
          debug("before spec run %o", { spec });

          capture.restore();

          captured = capture.stdout();

          return createInstance({
            spec,
            runId,
            group,
            groupId,
            platform,
            parallel,
            ciBuildId,
            machineId
          })
          .then(function(resp = {}) {
            ({ instanceId } = resp);

            //# pull off only what we need
            return _
            .chain(resp)
            .pick("spec", "claimedInstances", "totalInstances")
            .extend({
              estimated: resp.estimatedWallClockDuration
            })
            .value();
          });
        };

        const afterSpecRun = function(spec, results, config) {
          //# dont do anything if we failed to
          //# create the instance
          if (!instanceId) { return; }

          debug("after spec run %o", { spec });

          console.log("");

          terminal.header("Uploading Results", {
            color: ["blue"]
          });

          console.log("");

          return updateInstance({
            group,
            config,
            results,
            captured,
            parallel,
            ciBuildId,
            instanceId
          })
          .then(function(resp) {
            if (!resp) { return; }

            const { video, shouldUploadVideo, screenshots } = results;
            const { videoUploadUrl, screenshotUploadUrls } = resp;

            return uploadArtifacts({
              video,
              screenshots,
              videoUploadUrl,
              shouldUploadVideo,
              screenshotUploadUrls
            })
            .finally(() =>
              //# always attempt to upload stdout
              //# even if uploading failed
              updateInstanceStdout({
                captured,
                instanceId
              })
            );
          });
        };

        return runAllSpecs({ 
          runUrl,
          parallel, 
          beforeSpecRun,
          afterSpecRun,
        });
      }
    });
  });
};

module.exports = {
  createRun,

  createInstance,

  updateInstance,

  updateInstanceStdout,

  uploadArtifacts,

  warnIfCiFlag,

  throwIfNoProjectId,

  throwIfIndeterminateCiBuildId,

  throwIfIncorrectCiBuildIdUsage,

  warnIfProjectIdButNoRecordOption,

  throwIfRecordParamsWithoutRecording,

  createRunAndRecordSpecs,

  getCommitFromGitOrCi
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}