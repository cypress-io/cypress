"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/recordServiceValidationSdk.ts
var recordServiceValidationSdk_exports = {};
__export(recordServiceValidationSdk_exports, {
  HOOK_TYPE: () => HOOK_TYPE,
  assertSchema: () => assertSchema,
  commitSha: () => commitSha,
  commitShaExamples: () => commitShaExamples,
  dateTime: () => dateTime,
  dateTimeExample: () => dateTimeExample,
  durationEstimate: () => durationEstimate,
  durationEstimateExample: () => durationEstimateExample,
  getExample: () => getExample,
  hookId: () => hookId,
  hookIdExample: () => hookIdExample,
  hookType: () => hookType,
  instanceStatus: () => instanceStatus,
  instanceStatusExample: () => instanceStatusExample,
  postInstanceResultsRequest_v1: () => postInstanceResultsRequest_v1,
  postInstanceResultsRequest_v1Example: () => postInstanceResultsRequest_v1Example,
  postInstanceResultsResponse_v1: () => postInstanceResultsResponse_v1,
  postInstanceResultsResponse_v1Example: () => postInstanceResultsResponse_v1Example,
  postInstanceTestsRequest_v1: () => postInstanceTestsRequest_v1,
  postInstanceTestsRequest_v1Example: () => postInstanceTestsRequest_v1Example,
  postInstanceTestsResponse_v1: () => postInstanceTestsResponse_v1,
  postInstanceTestsResponse_v1Example: () => postInstanceTestsResponse_v1Example,
  postRunInstanceRequest_v1: () => postRunInstanceRequest_v1,
  postRunInstanceRequest_v1Example: () => postRunInstanceRequest_v1Example,
  postRunInstanceRequest_v2: () => postRunInstanceRequest_v2,
  postRunInstanceRequest_v2Example: () => postRunInstanceRequest_v2Example,
  postRunInstanceResponse_v1: () => postRunInstanceResponse_v1,
  postRunInstanceResponse_v1Example: () => postRunInstanceResponse_v1Example,
  postRunInstanceResponse_v2: () => postRunInstanceResponse_v2,
  postRunInstanceResponse_v2Example: () => postRunInstanceResponse_v2Example,
  postRunRequest_v1: () => postRunRequest_v1,
  postRunRequest_v1Example: () => postRunRequest_v1Example,
  postRunRequest_v2: () => postRunRequest_v2,
  postRunRequest_v2Example: () => postRunRequest_v2Example,
  postRunRequest_v3: () => postRunRequest_v3,
  postRunRequest_v3Example: () => postRunRequest_v3Example,
  postRunResponse_v1: () => postRunResponse_v1,
  postRunResponse_v1Example: () => postRunResponse_v1Example,
  postRunResponse_v2: () => postRunResponse_v2,
  postRunResponse_v2Example: () => postRunResponse_v2Example,
  postRunResponse_v3: () => postRunResponse_v3,
  postRunResponse_v3Example: () => postRunResponse_v3Example,
  projectId: () => projectId,
  projectIdExample: () => projectIdExample,
  putInstanceRequest_v1: () => putInstanceRequest_v1,
  putInstanceRequest_v1Example: () => putInstanceRequest_v1Example,
  putInstanceRequest_v2: () => putInstanceRequest_v2,
  putInstanceRequest_v2Example: () => putInstanceRequest_v2Example,
  putInstanceRequest_v3: () => putInstanceRequest_v3,
  putInstanceRequest_v3Example: () => putInstanceRequest_v3Example,
  putInstanceResponse_v1: () => putInstanceResponse_v1,
  putInstanceResponse_v1Example: () => putInstanceResponse_v1Example,
  putInstanceResponse_v2: () => putInstanceResponse_v2,
  putInstanceResponse_v2Example: () => putInstanceResponse_v2Example,
  putInstanceStdoutRequest_v1: () => putInstanceStdoutRequest_v1,
  putInstanceStdoutRequest_v1Example: () => putInstanceStdoutRequest_v1Example,
  recordSchemaVersions: () => recordSchemaVersions,
  runStatus: () => runStatus,
  runStatusExample: () => runStatusExample,
  screenshotUploadUrl_v1: () => screenshotUploadUrl_v1,
  screenshotUploadUrl_v1Example: () => screenshotUploadUrl_v1Example,
  screenshotUploadUrl_v2: () => screenshotUploadUrl_v2,
  screenshotUploadUrl_v2Example: () => screenshotUploadUrl_v2Example,
  semver: () => semver,
  semverExample: () => semverExample,
  testAction_v1: () => testAction_v1,
  testAction_v1Example: () => testAction_v1Example,
  testId: () => testId,
  testIdExample: () => testIdExample,
  testRunnerCI_v1: () => testRunnerCI_v1,
  testRunnerCI_v1Example: () => testRunnerCI_v1Example,
  testRunnerCI_v2: () => testRunnerCI_v2,
  testRunnerCI_v2Example: () => testRunnerCI_v2Example,
  testRunnerCapabilities_v1: () => testRunnerCapabilities_v1,
  testRunnerCapabilities_v1Example: () => testRunnerCapabilities_v1Example,
  testRunnerCodeFrame_v1: () => testRunnerCodeFrame_v1,
  testRunnerCodeFrame_v1Example: () => testRunnerCodeFrame_v1Example,
  testRunnerCommit_v1: () => testRunnerCommit_v1,
  testRunnerCommit_v1Example: () => testRunnerCommit_v1Example,
  testRunnerCommit_v2: () => testRunnerCommit_v2,
  testRunnerCommit_v2Example: () => testRunnerCommit_v2Example,
  testRunnerCypressStats_v1: () => testRunnerCypressStats_v1,
  testRunnerCypressStats_v1Example: () => testRunnerCypressStats_v1Example,
  testRunnerCypressStats_v1Strict: () => testRunnerCypressStats_v1Strict,
  testRunnerFailingTest_v1: () => testRunnerFailingTest_v1,
  testRunnerFailingTest_v1Example: () => testRunnerFailingTest_v1Example,
  testRunnerHook_v1: () => testRunnerHook_v1,
  testRunnerHook_v1Example: () => testRunnerHook_v1Example,
  testRunnerHook_v2: () => testRunnerHook_v2,
  testRunnerHook_v2Example: () => testRunnerHook_v2Example,
  testRunnerMochaReporterStats_v1: () => testRunnerMochaReporterStats_v1,
  testRunnerMochaReporterStats_v1Example: () => testRunnerMochaReporterStats_v1Example,
  testRunnerPlatform_v1: () => testRunnerPlatform_v1,
  testRunnerPlatform_v1Example: () => testRunnerPlatform_v1Example,
  testRunnerScreenshot_v1: () => testRunnerScreenshot_v1,
  testRunnerScreenshot_v1Example: () => testRunnerScreenshot_v1Example,
  testRunnerScreenshot_v2: () => testRunnerScreenshot_v2,
  testRunnerScreenshot_v2Example: () => testRunnerScreenshot_v2Example,
  testRunnerStudioMetaData_v1: () => testRunnerStudioMetaData_v1,
  testRunnerStudioMetaData_v1Example: () => testRunnerStudioMetaData_v1Example,
  testRunnerTestAttempt_v1: () => testRunnerTestAttempt_v1,
  testRunnerTestAttempt_v1Example: () => testRunnerTestAttempt_v1Example,
  testRunnerTestError_v1: () => testRunnerTestError_v1,
  testRunnerTestError_v1Example: () => testRunnerTestError_v1Example,
  testRunnerTestInfo_v1: () => testRunnerTestInfo_v1,
  testRunnerTestInfo_v1Example: () => testRunnerTestInfo_v1Example,
  testRunnerTestResult_v1: () => testRunnerTestResult_v1,
  testRunnerTestResult_v1Example: () => testRunnerTestResult_v1Example,
  testRunnerTest_v1: () => testRunnerTest_v1,
  testRunnerTest_v1Example: () => testRunnerTest_v1Example,
  testRunnerTest_v2: () => testRunnerTest_v2,
  testRunnerTest_v2Example: () => testRunnerTest_v2Example,
  testRunnerTimings_v1: () => testRunnerTimings_v1,
  testRunnerTimings_v1Example: () => testRunnerTimings_v1Example,
  testRunnerWarning_v1: () => testRunnerWarning_v1,
  testRunnerWarning_v1Example: () => testRunnerWarning_v1Example,
  testState: () => testState,
  testStateExample: () => testStateExample,
  uuid: () => uuid,
  uuidExample: () => uuidExample
});
module.exports = __toCommonJS(recordServiceValidationSdk_exports);

// src/record-service/manifest.ts
var import_zod32 = require("zod");

// src/record-service/postInstanceResultsRequest.ts
var import_zod15 = require("zod");

// src/record-service/commonTypes/testRunnerCypressStats.ts
var import_zod2 = require("zod");

// src/record-service/commonTypes/recordServiceFormats.ts
var import_zod = require("zod");
var commitSha = import_zod.z.string().regex(/^([a-f0-9]{7}|[a-f0-9]{40})$/i);
var commitShaExamples = ["260c9c7", "683b7b315216085de6445735304115495e36b4ca"];
var dateTime = import_zod.z.string().regex(/^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}[tT ]\d{2}:\d{2}:\d{2}(?:\.\d+|)([zZ]|[+-]\d{2}:\d{2})$/);
var dateTimeExample = ["1999-01-01T05:00:00.000Z"];
var durationEstimate = import_zod.z.string().regex(/^\d{0,9}(\.\d{1,3})?$/);
var durationEstimateExample = ["5280.361"];
var hookId = import_zod.z.string();
var hookIdExample = ["h1"];
var instanceStatus = import_zod.z.enum([
  "unclaimed",
  "running",
  "errored",
  "timedOut",
  "failed",
  "passed",
  "noTests",
  "cancelled"
]);
var instanceStatusExample = ["unclaimed"];
var projectId = import_zod.z.string().regex(/^([a-z0-9]{6}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/);
var projectIdExample = ["4b7344", "abc123"];
var runStatus = import_zod.z.enum([
  "running",
  "errored",
  "failed",
  "timedOut",
  "noTests",
  "passed",
  "overLimit",
  "cancelled"
]);
var runStatusExample = ["running"];
var semver = import_zod.z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-z0-9]+)?$/);
var semverExample = ["1.2.10"];
var testId = import_zod.z.string().regex(/^r\d+$/);
var testIdExample = ["r1"];
var testState = import_zod.z.enum([
  "passed",
  "pending",
  "skipped",
  "failed",
  "running",
  "cancelled",
  "errored",
  "timedOut"
]);
var testStateExample = "failed";
var uuid = import_zod.z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
var uuidExample = ["ffffffff-ffff-ffff-ffff-ffffffffffff"];
var HOOK_TYPE = ["before each", "before all", "after each", "after all"];
var hookType = import_zod.z.enum(HOOK_TYPE);

// src/record-service/commonTypes/testRunnerCypressStats.ts
var testRunnerCypressStats_v1 = import_zod2.z.object({
  failures: import_zod2.z.number().int(),
  passes: import_zod2.z.number().int(),
  pending: import_zod2.z.number().int(),
  // Number of tests that were skipped due to errors in "before" / "beforeEach" hooks
  skipped: import_zod2.z.number().int(),
  suites: import_zod2.z.number().int(),
  tests: import_zod2.z.number().int(),
  wallClockDuration: import_zod2.z.number().int(),
  //	ms
  wallClockEndedAt: dateTime,
  wallClockStartedAt: dateTime
});
var testRunnerCypressStats_v1Strict = testRunnerCypressStats_v1.strict();
var testRunnerCypressStats_v1Example = {
  failures: 3,
  passes: 1,
  pending: 1,
  skipped: 0,
  suites: 5,
  tests: 6,
  wallClockDuration: 1234,
  wallClockEndedAt: "2018-02-01T20:14:19.323Z",
  wallClockStartedAt: "2018-02-01T20:14:19.323Z"
};

// src/record-service/commonTypes/testRunnerMochaReporterStats.ts
var import_zod3 = require("zod");
var testRunnerMochaReporterStats_v1 = import_zod3.z.record(import_zod3.z.unknown()).and(
  import_zod3.z.object({
    duration: import_zod3.z.number().int(),
    end: dateTime,
    start: dateTime,
    failures: import_zod3.z.number().int(),
    passes: import_zod3.z.number().int(),
    pending: import_zod3.z.number().int(),
    suites: import_zod3.z.number().int(),
    tests: import_zod3.z.number().int()
  })
);
var testRunnerMochaReporterStats_v1Example = {
  duration: 1234,
  end: "2018-02-01T20:14:19.323Z",
  failures: 3,
  passes: 1,
  pending: 1,
  start: "2018-02-01T20:14:19.323Z",
  suites: 5,
  tests: 6
};

// src/record-service/commonTypes/testRunnerScreenshot.ts
var import_zod4 = require("zod");
var testRunnerScreenshot_v1 = import_zod4.z.object({
  clientId: import_zod4.z.string(),
  height: import_zod4.z.number().int(),
  testId: import_zod4.z.string().nullish(),
  testTitle: import_zod4.z.string(),
  title: import_zod4.z.string().nullish(),
  width: import_zod4.z.number().int()
});
var testRunnerScreenshot_v1Strict = testRunnerScreenshot_v1.strict();
var testRunnerScreenshot_v1Example = {
  clientId: "23942340234-cgdfgdfg-4565656",
  height: 1904,
  testId: "sdklfjsdf-234234sdf-sdf-3r23rvd",
  testTitle: "A Suite /// Test Title /// first screenshot",
  title: "Project List displays all projects.png",
  width: 3358
};
var testRunnerScreenshot_v2 = import_zod4.z.object({
  height: import_zod4.z.number(),
  name: import_zod4.z.string().nullable(),
  screenshotId: import_zod4.z.string(),
  takenAt: dateTime,
  testId,
  width: import_zod4.z.number(),
  testAttemptIndex: import_zod4.z.number().optional()
});
var testRunnerScreenshot_v2Strict = testRunnerScreenshot_v2.strict();
var testRunnerScreenshot_v2Example = {
  height: 720,
  name: "some screenshot name",
  screenshotId: "abc123",
  takenAt: "2016-05-13T02:37:15.748Z",
  testId: "r4",
  width: 1280
};

// src/record-service/commonTypes/testRunnerTestResult.ts
var import_zod9 = require("zod");

// src/record-service/commonTypes/testRunnerTestAttempt.ts
var import_zod8 = require("zod");

// src/record-service/commonTypes/testRunnerTestError.ts
var import_zod6 = require("zod");

// src/record-service/commonTypes/testRunnerCodeFrame.ts
var import_zod5 = require("zod");
var testRunnerCodeFrame_v1 = import_zod5.z.object({
  absoluteFile: import_zod5.z.string().nullable(),
  column: import_zod5.z.number().int().nullable(),
  frame: import_zod5.z.string().nullable(),
  language: import_zod5.z.string().nullable(),
  line: import_zod5.z.number().int().nullable(),
  originalFile: import_zod5.z.string().nullable(),
  relativeFile: import_zod5.z.string().nullable()
});
var testRunnerCodeFrame_v1Strict = testRunnerCodeFrame_v1.strict();
var testRunnerCodeFrame_v1Example = {
  absoluteFile: "/path/to/cypress/integration/spec.js",
  column: 8,
  frame: "   5 | \n   6 |   it('fails', () => {\n>  7 |     cy.get('nope', { timeout: 1 })\n     |        ^\n   8 |   })\n   9 | })\n  10 | ",
  language: "js",
  line: 7,
  originalFile: "cypress/integration/spec.js",
  relativeFile: "cypress/integration/spec.js"
};

// src/record-service/commonTypes/testRunnerTestError.ts
var testRunnerTestError_v1 = import_zod6.z.record(import_zod6.z.unknown()).and(
  import_zod6.z.object({
    codeFrame: testRunnerCodeFrame_v1.nullish(),
    message: import_zod6.z.string().nullable(),
    name: import_zod6.z.string().nullable(),
    stack: import_zod6.z.string().nullable()
  })
);
var testRunnerTestError_v1Example = {
  codeFrame: testRunnerCodeFrame_v1Example,
  message: "expected #greeting to include 'Hi brian-mann'",
  name: "AssertionError",
  stack: "<stack trace>"
};

// src/record-service/commonTypes/testRunnerTimings.ts
var import_zod7 = require("zod");
var hookTypeZ = import_zod7.z.array(
  import_zod7.z.object({
    hookId,
    fnDuration: import_zod7.z.number(),
    afterFnDuration: import_zod7.z.number()
  })
);
var hookType2 = import_zod7.z.object({
  "before each": hookTypeZ.optional(),
  "before all": hookTypeZ.optional(),
  "after each": hookTypeZ.optional(),
  "after all": hookTypeZ.optional()
});
var testRunnerTimings_v1 = import_zod7.z.object({
  test: import_zod7.z.object({
    fnDuration: import_zod7.z.number(),
    afterFnDuration: import_zod7.z.number()
  }).optional(),
  lifecycle: import_zod7.z.number().optional()
}).merge(hookType2);
var testRunnerTimings_v1Example = {
  lifecycle: 5,
  "before each": [
    { hookId: "h1", fnDuration: 30, afterFnDuration: 0 },
    { hookId: "h6", fnDuration: 5, afterFnDuration: 0 }
  ],
  test: { fnDuration: 1785, afterFnDuration: 1 },
  "after each": [{ hookId: "h2", fnDuration: 10, afterFnDuration: 0 }]
};

// src/record-service/commonTypes/testRunnerTestAttempt.ts
var testRunnerTestAttempt_v1 = import_zod8.z.object({
  error: testRunnerTestError_v1.nullable(),
  failedFromHookId: hookId.nullable(),
  state: testState,
  timings: testRunnerTimings_v1.nullable(),
  videoTimestamp: import_zod8.z.number().int().nullable(),
  wallClockDuration: import_zod8.z.number().int().nullable(),
  wallClockStartedAt: dateTime.nullable()
});
var testRunnerTestAttempt_v1Strict = testRunnerTestAttempt_v1.strict();
var testRunnerTestAttempt_v1Example = {
  error: testRunnerTestError_v1Example,
  failedFromHookId: "h1",
  state: "failed",
  timings: testRunnerTimings_v1Example,
  videoTimestamp: 9999,
  wallClockDuration: 1234,
  wallClockStartedAt: "2018-02-01T20:14:19.323Z"
};

// src/record-service/commonTypes/testRunnerTestResult.ts
var testRunnerTestResult_v1 = import_zod9.z.object({
  attempts: import_zod9.z.array(testRunnerTestAttempt_v1),
  clientId: testId,
  displayError: import_zod9.z.string().nullable(),
  state: testState
});
var testRunnerTestResult_v1Strict = testRunnerTestResult_v1.strict();
var testRunnerTestResult_v1Example = {
  attempts: [testRunnerTestAttempt_v1Example],
  clientId: "r4",
  displayError: "Attempt #1-3: AssertionError: expected #greeting to include 'Hi brian-mann' <stack trace>",
  state: "failed"
};

// src/record-service/putInstanceRequest.ts
var import_zod13 = require("zod");

// src/record-service/commonTypes/testRunnerFailingTest.ts
var import_zod10 = require("zod");
var testRunnerFailingTest_v1 = import_zod10.z.object({
  clientId: uuid,
  duration: import_zod10.z.number(),
  error: import_zod10.z.string(),
  stack: import_zod10.z.string(),
  title: import_zod10.z.string(),
  videoTimestamp: import_zod10.z.number()
});
var testRunnerFailingTest_v1Strict = testRunnerFailingTest_v1.strict();
var testRunnerFailingTest_v1Example = {
  clientId: "zdklfjsdf-234234sdf-sdf-3r23rvd",
  duration: 3005,
  error: "Test Error 2",
  stack: "Test Stack 2",
  title: "A Suite /// Test Title 2",
  videoTimestamp: 98724
};

// src/record-service/commonTypes/testRunnerHook.ts
var import_zod11 = require("zod");
var testRunnerHook_v1 = import_zod11.z.object({
  body: import_zod11.z.string(),
  hookId: import_zod11.z.string(),
  hookName: import_zod11.z.string(),
  title: import_zod11.z.array(import_zod11.z.string())
});
var testRunnerHook_v1Strict = testRunnerHook_v1.strict();
var testRunnerHook_v1Example = {
  body: 'function () {\n      throw new Error("fail1");\n    }',
  hookId: "h1",
  hookName: "before each",
  title: ['"before each" hook']
};
var testRunnerHook_v2 = import_zod11.z.object({
  body: import_zod11.z.string(),
  clientId: hookId,
  title: import_zod11.z.array(import_zod11.z.string()),
  type: hookType
});
var testRunnerHook_v2Strict = testRunnerHook_v2.strict();
var testRunnerHook_v2Example = {
  body: 'function () {\n      throw new Error("fail1");\n    }',
  clientId: "h1",
  title: ['"before each" hook'],
  type: "before each"
};

// src/record-service/commonTypes/testRunnerTest.ts
var import_zod12 = require("zod");
var testRunnerTest_v1 = import_zod12.z.object({
  body: import_zod12.z.string().nullable(),
  error: import_zod12.z.string().nullable(),
  failedFromHookId: hookId.nullable(),
  stack: import_zod12.z.string().nullable(),
  state: testState,
  testId,
  timings: testRunnerTimings_v1.nullable(),
  title: import_zod12.z.array(import_zod12.z.string()),
  videoTimestamp: import_zod12.z.number().nullable(),
  wallClockDuration: import_zod12.z.number().nullable(),
  wallClockStartedAt: dateTime.nullable()
});
var testRunnerTest_v1Strict = testRunnerTest_v1.strict();
var testRunnerTest_v1Example = {
  body: "function () {}",
  error: "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
  failedFromHookId: "h1",
  stack: "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at stack trace line",
  state: "failed",
  testId: "r4",
  timings: testRunnerTimings_v1Example,
  title: ["simple failing hook spec", "beforeEach hooks", "never gets here"],
  videoTimestamp: 9999,
  wallClockDuration: 1234,
  wallClockStartedAt: "2018-02-01T20:14:19.323Z"
};
var testRunnerTest_v2 = import_zod12.z.object({
  attempts: import_zod12.z.array(testRunnerTestAttempt_v1),
  body: import_zod12.z.string().nullable(),
  displayError: import_zod12.z.string().nullable(),
  state: testState,
  testId,
  title: import_zod12.z.array(import_zod12.z.string())
});
var testRunnerTest_v2Strict = testRunnerTest_v2.strict();
var testRunnerTest_v2Example = {
  attempts: [testRunnerTestAttempt_v1Example],
  body: "function () {}",
  displayError: "Attempt #1-3: AssertionError: expected #greeting to include 'Hi brian-mann' <stack trace>",
  state: "failed",
  testId: "r4",
  title: ["simple failing hook spec", "beforeEach hooks", "never gets here"]
};

// src/record-service/putInstanceRequest.ts
var putInstanceRequest_v1 = import_zod13.z.record(import_zod13.z.unknown()).and(
  import_zod13.z.object({
    ciProvider: import_zod13.z.string().nullish(),
    ciUrl: import_zod13.z.string().nullish(),
    cypressConfig: import_zod13.z.record(import_zod13.z.unknown()).nullish(),
    cypressVersion: import_zod13.z.string().nullish(),
    duration: import_zod13.z.number().nullish(),
    error: import_zod13.z.string().nullish(),
    failingTests: import_zod13.z.array(testRunnerFailingTest_v1).nullish(),
    failures: import_zod13.z.number().nullish(),
    passes: import_zod13.z.number().nullish(),
    pending: import_zod13.z.number().nullish(),
    screenshots: import_zod13.z.array(testRunnerScreenshot_v1).nullish(),
    spec: import_zod13.z.string().nullish(),
    stdout: import_zod13.z.string().nullish(),
    tests: import_zod13.z.number().nullish(),
    video: import_zod13.z.boolean().nullish()
  })
);
var putInstanceRequest_v1Example = {
  cypressConfig: {
    reporter: "spec",
    settingA: "A",
    settingB: "B",
    settingC: "C"
  },
  duration: 1234,
  error: null,
  failingTests: [testRunnerFailingTest_v1Example],
  failures: 1,
  passes: 1232,
  pending: 2,
  screenshots: [testRunnerScreenshot_v1Example],
  tests: 1235,
  video: true
};
var putInstanceRequest_v2 = import_zod13.z.object({
  cypressConfig: import_zod13.z.record(import_zod13.z.unknown()),
  error: import_zod13.z.string().nullable(),
  hooks: import_zod13.z.array(testRunnerHook_v1).nullable(),
  reporterStats: testRunnerMochaReporterStats_v1.nullable(),
  screenshots: import_zod13.z.array(testRunnerScreenshot_v2).nullable(),
  stats: testRunnerCypressStats_v1,
  stdout: import_zod13.z.string().nullable(),
  tests: import_zod13.z.array(testRunnerTest_v1).nullable(),
  video: import_zod13.z.boolean()
});
var putInstanceRequest_v2Strict = putInstanceRequest_v2.strict();
var putInstanceRequest_v2Example = {
  cypressConfig: {},
  error: null,
  hooks: [testRunnerHook_v1Example],
  reporterStats: testRunnerMochaReporterStats_v1Example,
  screenshots: [testRunnerScreenshot_v2Example],
  stats: testRunnerCypressStats_v1Example,
  stdout: "something there",
  tests: [testRunnerTest_v1Example],
  video: true
};
var putInstanceRequest_v3 = putInstanceRequest_v2.omit({ stdout: true, tests: true }).extend({
  tests: import_zod13.z.array(testRunnerTest_v2).nullable()
});
var putInstanceRequest_v3Strict = putInstanceRequest_v3.strict();
var putInstanceRequest_v3Example = {
  cypressConfig: {},
  error: null,
  hooks: [testRunnerHook_v1Example],
  reporterStats: testRunnerMochaReporterStats_v1Example,
  screenshots: [testRunnerScreenshot_v2Example],
  stats: testRunnerCypressStats_v1Example,
  tests: [testRunnerTest_v2Example],
  video: true
};

// src/record-service/commonTypes/testRunnerStudioMetadata.ts
var import_zod14 = require("zod");
var testRunnerStudioMetaData_v1 = import_zod14.z.object({
  studioCreated: import_zod14.z.number().int().nullable(),
  studioExtended: import_zod14.z.number().int().nullable()
});
var testRunnerStudioMetaData_v1Strict = testRunnerStudioMetaData_v1.strict();
var testRunnerStudioMetaData_v1Example = {
  studioCreated: 1,
  studioExtended: 1
};

// src/record-service/postInstanceResultsRequest.ts
var postInstanceResultsRequest_v1 = putInstanceRequest_v3.pick({
  reporterStats: true,
  screenshots: true,
  stats: true,
  video: true
}).extend({
  exception: import_zod15.z.string().nullish(),
  tests: import_zod15.z.array(testRunnerTestResult_v1),
  metadata: testRunnerStudioMetaData_v1.nullish()
});
var postInstanceResultsRequest_v1Strict = postInstanceResultsRequest_v1.strict();
var postInstanceResultsRequest_v1Example = {
  exception: null,
  reporterStats: testRunnerMochaReporterStats_v1Example,
  screenshots: [testRunnerScreenshot_v2Example],
  stats: testRunnerCypressStats_v1Example,
  tests: [testRunnerTestResult_v1Example],
  video: true,
  metadata: null
};

// src/record-service/postInstanceResultsResponse.ts
var import_zod17 = require("zod");

// src/record-service/commonTypes/screenshotUploadUrl.ts
var import_zod16 = require("zod");
var screenshotUploadUrl_v1 = import_zod16.z.object({
  clientId: import_zod16.z.string(),
  uploadUrl: import_zod16.z.string()
});
var screenshotUploadUrl_v1Strict = screenshotUploadUrl_v1.strict();
var screenshotUploadUrl_v1Example = {
  clientId: "some-internal-id",
  uploadUrl: "https://builds.cypress.io/564/screenshots/1.png"
};
var screenshotUploadUrl_v2 = import_zod16.z.object({
  screenshotId: import_zod16.z.string(),
  uploadUrl: import_zod16.z.string()
});
var screenshotUploadUrl_v2Strict = screenshotUploadUrl_v2.strict();
var screenshotUploadUrl_v2Example = {
  screenshotId: "abc123",
  uploadUrl: "https://builds.cypress.io/564/screenshots/1.png"
};

// src/record-service/postInstanceResultsResponse.ts
var postInstanceResultsResponse_v1 = import_zod17.z.object({
  screenshotUploadUrls: import_zod17.z.array(screenshotUploadUrl_v2),
  videoUploadUrl: import_zod17.z.string().optional()
});
var postInstanceResultsResponse_v1Strict = postInstanceResultsResponse_v1.strict();
var postInstanceResultsResponse_v1Example = {
  screenshotUploadUrls: [screenshotUploadUrl_v2Example],
  videoUploadUrl: "http://builds.cypress.io/:build_id/screencast.mp4"
};

// src/record-service/postInstanceTestsRequest.ts
var import_zod19 = require("zod");

// src/record-service/commonTypes/testRunnerTestInfo.ts
var import_zod18 = require("zod");
var testRunnerTestInfo_v1 = import_zod18.z.object({
  body: import_zod18.z.string().nullable(),
  clientId: import_zod18.z.string(),
  config: import_zod18.z.record(import_zod18.z.unknown()),
  hookIds: import_zod18.z.array(hookId),
  title: import_zod18.z.array(import_zod18.z.string())
});
var testRunnerTestInfo_v1Strict = testRunnerTestInfo_v1.strict();
var testRunnerTestInfo_v1Example = {
  body: "function () {}",
  clientId: "r4",
  config: {
    reporter: "spec",
    settingA: "A",
    settingB: "B",
    settingC: "C"
  },
  hookIds: ["h1", "h2", "h3"],
  title: ["simple failing hook spec", "beforeEach hooks", "never gets here"]
};

// src/record-service/postInstanceTestsRequest.ts
var postInstanceTestsRequest_v1 = import_zod19.z.object({
  config: import_zod19.z.record(import_zod19.z.unknown()),
  hooks: import_zod19.z.array(testRunnerHook_v2),
  tests: import_zod19.z.array(testRunnerTestInfo_v1)
});
var postInstanceTestsRequest_v1Strict = postInstanceTestsRequest_v1.strict();
var postInstanceTestsRequest_v1Example = {
  config: {
    reporter: "spec",
    settingA: "A",
    settingB: "B",
    settingC: "C"
  },
  hooks: [testRunnerHook_v2Example],
  tests: [testRunnerTestInfo_v1Example]
};

// src/record-service/postInstanceTestsResponse.ts
var import_zod21 = require("zod");

// src/record-service/commonTypes/testAction.ts
var import_zod20 = require("zod");
var testAction_v1 = import_zod20.z.object({
  action: import_zod20.z.enum(["SKIP", "MUTE", "BURN_IN"]),
  clientId: import_zod20.z.string().nullable(),
  payload: import_zod20.z.record(import_zod20.z.unknown()).nullable(),
  type: import_zod20.z.enum(["SPEC", "TEST"])
});
var testAction_v1Strict = testAction_v1.strict();
var testAction_v1Example = {
  action: "MUTE",
  clientId: "r1",
  payload: null,
  type: "SPEC"
};

// src/record-service/postInstanceTestsResponse.ts
var postInstanceTestsResponse_v1 = import_zod21.z.object({
  actions: import_zod21.z.array(testAction_v1).nullable(),
  claimedInstances: import_zod21.z.number().int(),
  estimatedWallClockDuration: import_zod21.z.number().int().nullable(),
  instanceId: import_zod21.z.string().nullable(),
  spec: import_zod21.z.string().nullable(),
  totalInstances: import_zod21.z.number().int()
});
var postInstanceTestsResponse_v1Strict = postInstanceTestsResponse_v1.strict();
var postInstanceTestsResponse_v1Example = {
  actions: [testAction_v1Example],
  claimedInstances: 1,
  estimatedWallClockDuration: 300,
  instanceId: "e9e81b5e-cc58-4026-b2ff-8ae3161435a6",
  spec: "spec/to/run.js",
  totalInstances: 3
};

// src/record-service/postRunInstanceRequest.ts
var import_zod23 = require("zod");

// src/record-service/commonTypes/testRunnerPlatform.ts
var import_zod22 = require("zod");
var testRunnerPlatform_v1 = import_zod22.z.object({
  //	Browser name, for example Chrome
  browserName: import_zod22.z.string(),
  //	Browser version, for example 65.0.2785.143
  browserVersion: import_zod22.z.string(),
  // Information for every detected CPU core
  osCpus: import_zod22.z.array(import_zod22.z.unknown()),
  osMemory: import_zod22.z.record(import_zod22.z.string(), import_zod22.z.unknown()).nullable(),
  // "linux", "darwin", "win32"	Operating system name, for example "win32"
  osName: import_zod22.z.string(),
  //	Operating system version
  osVersion: import_zod22.z.string()
});
var testRunnerPlatform_v1Strict = testRunnerPlatform_v1.strict();
var testRunnerPlatform_v1Example = {
  browserName: "Electron",
  browserVersion: "53.0.2785.143",
  osCpus: [
    {
      model: "Intel(R) Xeon(R) CPU E5-2680 v2 @ 2.80GHz",
      speed: 2800,
      times: {
        idle: 649447e3,
        irq: 0,
        nice: 200800,
        sys: 94852500,
        user: 300415800
      }
    }
  ],
  osMemory: {
    free: 1e4,
    total: 2e4
  },
  osName: "linux",
  osVersion: "14.04"
};

// src/record-service/postRunInstanceRequest.ts
var postRunInstanceRequest_v1 = testRunnerPlatform_v1.partial({
  osCpus: true,
  osMemory: true
}).extend({
  spec: import_zod23.z.string().nullish().describe("Name of the spec, or null if all specs were tested")
});
var postRunInstanceRequest_v1Strict = postRunInstanceRequest_v1.strict();
var postRunInstanceRequest_v1Example = {
  browserName: "Chromium",
  browserVersion: "41",
  osCpus: [
    {
      model: "Intel(R) Xeon(R) CPU E5-2680 v2 @ 2.80GHz",
      speed: 2800,
      times: {
        idle: 649447e3,
        irq: 0,
        nice: 200800,
        sys: 94852500,
        user: 200415800
      }
    }
  ],
  osMemory: {
    free: 100,
    total: 200
  },
  osName: "darwin",
  osVersion: "10.12.1",
  spec: "integrations/forums_spec.js"
};
var postRunInstanceRequest_v2 = import_zod23.z.object({
  groupId: import_zod23.z.string(),
  machineId: uuid,
  platform: testRunnerPlatform_v1,
  spec: import_zod23.z.string().nullable()
});
var postRunInstanceRequest_v2Strict = postRunInstanceRequest_v2.strict();
var postRunInstanceRequest_v2Example = {
  groupId: "darwin-Chromium-41",
  machineId: "d91d2bcf-6398-46ed-b201-2fd90b188d5f",
  platform: testRunnerPlatform_v1Example,
  spec: "integration/forums_spec.js"
};

// src/record-service/postRunInstanceResponse.ts
var import_zod24 = require("zod");
var postRunInstanceResponse_v1 = import_zod24.z.object({
  instanceId: import_zod24.z.string()
});
var postRunInstanceResponse_v1Strict = postRunInstanceResponse_v1.strict();
var postRunInstanceResponse_v1Example = {
  instanceId: "d91d2bcf-6398-46ed-b201-2fd90b188d5f"
};
var postRunInstanceResponse_v2 = postRunInstanceResponse_v1.extend({
  claimedInstances: import_zod24.z.number().int(),
  estimatedWallClockDuration: import_zod24.z.number().int().nullable(),
  instanceId: import_zod24.z.string().nullable(),
  spec: import_zod24.z.string().nullable(),
  totalInstances: import_zod24.z.number().int()
});
var postRunInstanceResponse_v2Strict = postRunInstanceResponse_v2.strict();
var postRunInstanceResponse_v2Example = {
  claimedInstances: 7,
  estimatedWallClockDuration: 8382,
  instanceId: "e9e81b5e-cc58-4026-b2ff-8ae3161435a6",
  spec: "integration/a-spec.js",
  totalInstances: 18
};

// src/record-service/postRunRequest.ts
var import_zod28 = require("zod");

// src/record-service/commonTypes/testRunnerCI.ts
var import_zod25 = require("zod");
var testRunnerCI_v1 = import_zod25.z.object({
  buildNumber: import_zod25.z.string().nullish(),
  params: import_zod25.z.record(import_zod25.z.string(), import_zod25.z.any()).nullish(),
  provider: import_zod25.z.string().nullish()
});
var testRunnerCI_v1Strict = testRunnerCI_v1.strict();
var testRunnerCI_v1Example = {
  buildNumber: "123",
  params: {
    accountName: "foo"
  },
  provider: "CircelCI"
};
var testRunnerCI_v2 = testRunnerCI_v1.omit({ buildNumber: true });
var testRunnerCI_v2Strict = testRunnerCI_v2.strict();
var testRunnerCI_v2Example = {
  params: {
    accountName: "foo"
  },
  provider: "CircelCI"
};

// src/record-service/commonTypes/testRunnerCommit.ts
var import_zod26 = require("zod");
var testRunnerCommit_v1 = import_zod26.z.object({
  // Usually author email
  authorEmail: import_zod26.z.string().nullable(),
  // Author name, like Joe Smith
  authorName: import_zod26.z.string().nullable(),
  // Git branch
  branch: import_zod26.z.string().nullable(),
  // Commit message
  message: import_zod26.z.string().nullable(),
  // Remote Git origin url
  remoteOrigin: import_zod26.z.string().nullable(),
  // Typically a commit SHA
  sha: import_zod26.z.string().nullable()
});
var testRunnerCommit_v1Strict = testRunnerCommit_v1.strict();
var testRunnerCommit_v1Example = {
  authorEmail: "me@company.com",
  authorName: "Joe Doe",
  branch: "master",
  message: "greatest feature ever",
  remoteOrigin: null,
  sha: "69cc7efa6b8fec8896debd4b3a2fae2a6120d431"
};
var testRunnerCommit_v2 = testRunnerCommit_v1.extend({
  defaultBranch: import_zod26.z.string().nullable()
});
var testRunnerCommit_v2Strict = testRunnerCommit_v2.strict();
var testRunnerCommit_v2Example = __spreadProps(__spreadValues({}, testRunnerCommit_v1Example), {
  defaultBranch: "develop"
});

// src/record-service/commonTypes/testRunnerCapabilities.ts
var import_zod27 = require("zod");
var testRunnerCapabilities_v1 = import_zod27.z.object({
  // supports reordering specs in serial mode from postRunInstance
  dynamicSpecsInSerialMode: import_zod27.z.literal(true).optional(),
  // supports test muting from postInstanceTests
  muteTestAction: import_zod27.z.literal(true).optional(),
  // supports spec skipping / runs cancellation from postInstanceTests
  skipSpecAction: import_zod27.z.literal(true).optional()
});
var testRunnerCapabilities_v1Strict = testRunnerCapabilities_v1.strict();
var testRunnerCapabilities_v1Example = {
  dynamicSpecsInSerialMode: true,
  skipSpecAction: true
};

// src/record-service/postRunRequest.ts
var postRunRequest_v1 = import_zod28.z.object({
  projectId,
  ciBuildNumber: import_zod28.z.string().nullish(),
  ciParams: import_zod28.z.record(import_zod28.z.string(), import_zod28.z.any()).nullish(),
  ciProvider: import_zod28.z.string().nullish(),
  commitAuthor: import_zod28.z.string().nullish(),
  commitAuthorEmail: import_zod28.z.string().nullish(),
  commitAuthorName: import_zod28.z.string().nullish(),
  commitBranch: import_zod28.z.string().nullish(),
  commitMessage: import_zod28.z.string().nullish(),
  commitSha: import_zod28.z.string().nullish(),
  groupId: import_zod28.z.string().or(import_zod28.z.number()).nullish(),
  recordKey: uuid,
  remoteOrigin: import_zod28.z.string().nullish(),
  specPattern: import_zod28.z.string().nullish(),
  specs: import_zod28.z.array(import_zod28.z.string()).nullish()
});
var postRunRequest_v1Strict = postRunRequest_v1.strict();
var postRunRequest_v1Example = {
  ciBuildNumber: "123",
  ciParams: {
    accountName: "foo"
  },
  ciProvider: "CircelCI",
  commitAuthor: "Jane Lane",
  commitAuthorEmail: "janelane@example.com",
  commitAuthorName: "Jane Lane",
  commitBranch: "master",
  commitMessage: "A lot of awesome code",
  commitSha: "83fb86a31f05490d9ed39922dcbdbdbc0747c8d0",
  groupId: null,
  projectId: "abc123",
  recordKey: "f858a2bc-b469-4e48-be67-0876339ee7e1",
  remoteOrigin: "https://github.com/username/repo.git",
  specs: ["spec.js"]
};
var postRunRequest_v2 = import_zod28.z.object({
  ci: testRunnerCI_v1.nullable(),
  commit: testRunnerCommit_v1.nullable(),
  platform: testRunnerPlatform_v1,
  projectId,
  recordKey: uuid,
  specPattern: import_zod28.z.string().nullable(),
  specs: import_zod28.z.array(import_zod28.z.string())
});
var postRunRequest_v2Strict = postRunRequest_v2.strict();
var postRunRequest_v2Example = {
  ci: testRunnerCI_v1Example,
  commit: testRunnerCommit_v1Example,
  platform: testRunnerPlatform_v1Example,
  projectId: "abc123",
  recordKey: "f858a2bc-b469-4e48-be67-0876339ee7e1",
  specPattern: "*-spec.js",
  specs: ["foo-spec.js", "bar-spec.js"]
};
var postRunRequest_v3 = postRunRequest_v2.extend({
  ci: testRunnerCI_v2,
  commit: testRunnerCommit_v2,
  ciBuildId: import_zod28.z.string().or(import_zod28.z.number()).nullable(),
  group: import_zod28.z.string().nullable(),
  parallel: import_zod28.z.boolean().nullable(),
  runnerCapabilities: import_zod28.z.record(import_zod28.z.unknown()).optional(),
  testingType: import_zod28.z.enum(["e2e", "component", "ct"]).optional(),
  tags: import_zod28.z.array(import_zod28.z.string()).optional(),
  autoCancelAfterFailures: import_zod28.z.union([import_zod28.z.number(), import_zod28.z.literal(false)]).optional()
});
var postRunRequest_v3Strict = postRunRequest_v3.strict();
var postRunRequest_v3Example = __spreadProps(__spreadValues({}, postRunRequest_v2Example), {
  ci: testRunnerCI_v2Example,
  commit: testRunnerCommit_v2Example,
  group: "frontend",
  parallel: true,
  ciBuildId: "build-or-workflow-num",
  runnerCapabilities: testRunnerCapabilities_v1Example,
  testingType: "e2e",
  tags: ["tag-1", "tag-2"],
  autoCancelAfterFailures: false
});

// src/record-service/postRunResponse.ts
var import_zod30 = require("zod");

// src/record-service/commonTypes/testRunnerWarning.ts
var import_zod29 = require("zod");
var testRunnerWarning_v1 = import_zod29.z.record(import_zod29.z.string(), import_zod29.z.unknown()).and(
  import_zod29.z.object({
    code: import_zod29.z.string(),
    message: import_zod29.z.string(),
    name: import_zod29.z.string()
  })
);
var testRunnerWarning_v1Example = {
  code: "OUT_OF_TIME",
  hadTime: 1e3,
  message: "You are almost out of time",
  name: "OutOfTime",
  spentTime: 999
};

// src/record-service/postRunResponse.ts
var postRunResponse_v1 = import_zod30.z.object({
  buildId: uuid
});
var postRunResponse_v1Strict = postRunResponse_v1.strict();
var postRunResponse_v1Example = {
  buildId: "00748421-e035-4a3d-8604-8468cc48bdb5"
};
var postRunResponse_v2 = import_zod30.z.object({
  runId: uuid,
  groupId: import_zod30.z.string(),
  machineId: uuid,
  runUrl: import_zod30.z.string()
});
var postRunResponse_v2Strict = postRunResponse_v2.strict();
var postRunResponse_v2Example = {
  groupId: "a-plan-id",
  machineId: "5d82e54f-a4e9-48a0-b627-1502185dc2a4",
  runId: "00748421-e035-4a3d-8604-8468cc48bdb5",
  runUrl: "https://dashboard.cypress.io/projects/cjvoj7/runs/12"
};
var postRunResponse_v3 = postRunResponse_v2.extend({
  warnings: import_zod30.z.array(testRunnerWarning_v1),
  tags: import_zod30.z.array(import_zod30.z.string()).nullable()
});
var postRunResponse_v3Strict = postRunResponse_v3.strict();
var postRunResponse_v3Example = __spreadProps(__spreadValues({}, postRunResponse_v2Example), {
  warnings: [testRunnerWarning_v1Example],
  tags: ["staging", "test", "test-tag"]
});

// src/record-service/putInstanceStdoutRequest.ts
var import_zod31 = require("zod");
var putInstanceStdoutRequest_v1 = import_zod31.z.object({
  stdout: import_zod31.z.string()
});
var putInstanceStdoutRequest_v1Strict = putInstanceStdoutRequest_v1.strict();
var putInstanceStdoutRequest_v1Example = {
  stdout: "something from the test runner"
};

// src/record-service/manifest.ts
var recordSchemaVersions = {
  createRun: {
    4: {
      req: postRunRequest_v3,
      reqExample: postRunRequest_v3Example,
      res: postRunResponse_v3,
      resExample: postRunResponse_v3Example
    }
  },
  createInstance: {
    5: {
      req: postRunInstanceRequest_v2,
      reqExample: postRunInstanceRequest_v2Example,
      res: postRunInstanceResponse_v2,
      resExample: postRunInstanceResponse_v2Example
    }
  },
  updateInstanceStdout: {
    1: {
      req: putInstanceStdoutRequest_v1,
      reqExample: putInstanceStdoutRequest_v1Example,
      res: import_zod32.z.any(),
      resExample: {}
    }
  },
  postInstanceTests: {
    1: {
      req: postInstanceTestsRequest_v1,
      reqExample: postInstanceTestsRequest_v1Example,
      res: postInstanceTestsResponse_v1,
      resExample: postInstanceTestsResponse_v1Example
    }
  },
  postInstanceResults: {
    1: {
      req: postInstanceResultsRequest_v1,
      reqExample: postInstanceResultsRequest_v1Example,
      res: postInstanceResultsResponse_v1,
      resExample: postInstanceResultsResponse_v1Example
    }
  }
};

// src/record-service/putInstanceResponse.ts
var import_zod33 = require("zod");
var putInstanceResponse_v1 = import_zod33.z.object({
  screenshotUploadUrls: import_zod33.z.array(screenshotUploadUrl_v1),
  videoUploadUrl: import_zod33.z.string().optional()
});
var putInstanceResponse_v1Strict = putInstanceResponse_v1.strict();
var putInstanceResponse_v1Example = {
  screenshotUploadUrls: [screenshotUploadUrl_v1Example],
  videoUploadUrl: "http://builds.cypress.io/:build_id/screencast.mp4"
};
var putInstanceResponse_v2 = import_zod33.z.object({
  screenshotUploadUrls: import_zod33.z.array(screenshotUploadUrl_v2),
  videoUploadUrl: import_zod33.z.string().optional()
});
var putInstanceResponse_v2Strict = putInstanceResponse_v2.strict();
var putInstanceResponse_v2Example = {
  screenshotUploadUrls: [screenshotUploadUrl_v2Example],
  videoUploadUrl: "http://builds.cypress.io/:build_id/screencast.mp4"
};

// src/recordServiceValidationSdk.ts
function getExample(route, version, type) {
  const routeDef = recordSchemaVersions[route][version];
  if (!routeDef) {
    throw new Error(`Invalid route: ${route} version ${version}`);
  }
  return routeDef[`${type}Example`];
}
function assertSchema(route, version, type) {
  return (body) => {
    const routeDef = recordSchemaVersions[route][version];
    if (!routeDef) {
      throw new Error(`Invalid route: ${route} version ${version}`);
    }
    routeDef[type].parse(body);
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HOOK_TYPE,
  assertSchema,
  commitSha,
  commitShaExamples,
  dateTime,
  dateTimeExample,
  durationEstimate,
  durationEstimateExample,
  getExample,
  hookId,
  hookIdExample,
  hookType,
  instanceStatus,
  instanceStatusExample,
  postInstanceResultsRequest_v1,
  postInstanceResultsRequest_v1Example,
  postInstanceResultsResponse_v1,
  postInstanceResultsResponse_v1Example,
  postInstanceTestsRequest_v1,
  postInstanceTestsRequest_v1Example,
  postInstanceTestsResponse_v1,
  postInstanceTestsResponse_v1Example,
  postRunInstanceRequest_v1,
  postRunInstanceRequest_v1Example,
  postRunInstanceRequest_v2,
  postRunInstanceRequest_v2Example,
  postRunInstanceResponse_v1,
  postRunInstanceResponse_v1Example,
  postRunInstanceResponse_v2,
  postRunInstanceResponse_v2Example,
  postRunRequest_v1,
  postRunRequest_v1Example,
  postRunRequest_v2,
  postRunRequest_v2Example,
  postRunRequest_v3,
  postRunRequest_v3Example,
  postRunResponse_v1,
  postRunResponse_v1Example,
  postRunResponse_v2,
  postRunResponse_v2Example,
  postRunResponse_v3,
  postRunResponse_v3Example,
  projectId,
  projectIdExample,
  putInstanceRequest_v1,
  putInstanceRequest_v1Example,
  putInstanceRequest_v2,
  putInstanceRequest_v2Example,
  putInstanceRequest_v3,
  putInstanceRequest_v3Example,
  putInstanceResponse_v1,
  putInstanceResponse_v1Example,
  putInstanceResponse_v2,
  putInstanceResponse_v2Example,
  putInstanceStdoutRequest_v1,
  putInstanceStdoutRequest_v1Example,
  recordSchemaVersions,
  runStatus,
  runStatusExample,
  screenshotUploadUrl_v1,
  screenshotUploadUrl_v1Example,
  screenshotUploadUrl_v2,
  screenshotUploadUrl_v2Example,
  semver,
  semverExample,
  testAction_v1,
  testAction_v1Example,
  testId,
  testIdExample,
  testRunnerCI_v1,
  testRunnerCI_v1Example,
  testRunnerCI_v2,
  testRunnerCI_v2Example,
  testRunnerCapabilities_v1,
  testRunnerCapabilities_v1Example,
  testRunnerCodeFrame_v1,
  testRunnerCodeFrame_v1Example,
  testRunnerCommit_v1,
  testRunnerCommit_v1Example,
  testRunnerCommit_v2,
  testRunnerCommit_v2Example,
  testRunnerCypressStats_v1,
  testRunnerCypressStats_v1Example,
  testRunnerCypressStats_v1Strict,
  testRunnerFailingTest_v1,
  testRunnerFailingTest_v1Example,
  testRunnerHook_v1,
  testRunnerHook_v1Example,
  testRunnerHook_v2,
  testRunnerHook_v2Example,
  testRunnerMochaReporterStats_v1,
  testRunnerMochaReporterStats_v1Example,
  testRunnerPlatform_v1,
  testRunnerPlatform_v1Example,
  testRunnerScreenshot_v1,
  testRunnerScreenshot_v1Example,
  testRunnerScreenshot_v2,
  testRunnerScreenshot_v2Example,
  testRunnerStudioMetaData_v1,
  testRunnerStudioMetaData_v1Example,
  testRunnerTestAttempt_v1,
  testRunnerTestAttempt_v1Example,
  testRunnerTestError_v1,
  testRunnerTestError_v1Example,
  testRunnerTestInfo_v1,
  testRunnerTestInfo_v1Example,
  testRunnerTestResult_v1,
  testRunnerTestResult_v1Example,
  testRunnerTest_v1,
  testRunnerTest_v1Example,
  testRunnerTest_v2,
  testRunnerTest_v2Example,
  testRunnerTimings_v1,
  testRunnerTimings_v1Example,
  testRunnerWarning_v1,
  testRunnerWarning_v1Example,
  testState,
  testStateExample,
  uuid,
  uuidExample
});
