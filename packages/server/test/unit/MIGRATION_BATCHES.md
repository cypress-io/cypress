# Mocha `*_spec` → Vitest `*.spec.ts` migration tracker

Scope: legacy unit tests under `packages/server/test/unit/` matching `**/*_spec.{js,ts}` (Mocha). Vitest runs `**/*.spec.{js,ts}` and ignores `*_spec` (see `vitest.config.ts`).

**Convention:** When a file is migrated, add `foo.spec.ts`, delete `foo_spec.ts`, run `yarn workspace @packages/server test-unit-vitest -- <path>`, and check the box below.

**Batch sizing:** Each batch is **≤3000 LOC** (line counts from current `*_spec` files). If a single file ever exceeds 3000 LOC, it should be **its own batch**; none of the current files cross that bar (largest is `browsers/bidi_automation_spec.ts` ~2.4k).

**Totals (baseline):** ~106 files, ~34.7k LOC — batches are sliced for reviewable PRs (theme where it fits, hard cap on LOC).

---

## Progress summary

| Batch | Theme                                      | ~LOC | Files | Done |
| ----- | ------------------------------------------ | ---- | ----- | ---- |
| 1     | `util/` — args, CI, file, commit-info      | 2970 | 4     | [ ]  |
| 2     | `util/` — remainder                        | 1400 | 17    | [ ]  |
| 3     | `browsers/` — BiDi + CDP base               | 2860 | 5     | [ ]  |
| 4     | `browsers/` — CRI, launchers, WebKit line  | 2630 | 6     | [ ]  |
| 5     | `browsers/` — Firefox + memory profiler    | 1290 | 2     | [ ]  |
| 6     | `browsers/` — Chrome + Electron            | 2710 | 2     | [ ]  |
| 7     | `cloud/api/` — core HTTP + cy-prompt start | 2870 | 5     | [ ]  |
| 8     | `cloud/api/` — cy-prompt report + studio + artifact | 1170 | 5 | [ ]  |
| 9     | `cloud/studio/` + telemetry                | 2380 | 6     | [ ]  |
| 10    | `cloud/cy-prompt/` managers                | 1110 | 3     | [ ]  |
| 11    | `cloud/` core (auth, routes, env, …)      | 2620 | 12    | [ ]  |
| 12    | `plugins/` + `modes/` + `gui/`             | 2080 | 13    | [ ]  |
| 13    | `automation/` + fixtures + misc small      | 2310 | 16    | [ ]  |
| 14    | Top-level — `config` + `project-base`      | 2420 | 2     | [ ]  |
| 15    | Top-level — `socket`                       | 1210 | 1     | [ ]  |
| 16    | Top-level — `request`                      | 1090 | 1     | [ ]  |
| 17    | Top-level — open, reporter, screenshots, … | 1600 | 6     | [ ]  |

*LOC rounded to ~10s for the table; exact sums are in each batch heading.*

---

## Batch 1 — `util/` args, CI, file, commit-info (~2966 LOC, 4 files)

- [ ] `util/args_spec.js`
- [ ] `util/ci_provider_spec.js`
- [ ] `util/file_spec.ts`
- [ ] `util/commit-info_spec.ts`

---

## Batch 2 — `util/` remainder (~1403 LOC, 17 files)

- [ ] `util/process_profiler_spec.ts`
- [ ] `util/editors_spec.ts`
- [ ] `util/terminal_spec.ts`
- [ ] `util/app_data_spec.js`
- [ ] `util/settings_spec.js`
- [ ] `util/profile_cleaner_spec.js`
- [ ] `util/find_process_spec.ts`
- [ ] `util/tty_spec.ts`
- [ ] `util/trash_spec.ts`
- [ ] `util/chromium_flags_spec.js`
- [ ] `util/cache_buster_spec.js`
- [ ] `util/electron-app_spec.js`
- [ ] `util/random_spec.ts`
- [ ] `util/obj_utils_spec.ts`
- [ ] `util/newlines_spec.ts`
- [ ] `util/socket_allowed_spec.ts`
- [ ] `util/suppress_warnings_spec.ts`

---

## Batch 3 — `browsers/` BiDi + CDP plumbing (~2861 LOC, 5 files)

- [ ] `browsers/bidi_automation_spec.ts`
- [ ] `browsers/cdp-connection_spec.ts`
- [ ] `browsers/protocol_spec.ts`
- [ ] `browsers/memory/default_spec.ts`
- [ ] `browsers/memory/cgroup-v1_spec.ts`

---

## Batch 4 — `browsers/` CRI, launchers, WebKit line (~2630 LOC, 6 files)

- [ ] `browsers/cdp_automation_spec.ts`
- [ ] `browsers/browser-cri-client_spec.ts`
- [ ] `browsers/privileged-channel_spec.js`
- [ ] `browsers/webkit_spec.ts`
- [ ] `browsers/firefox-util_spec.ts`
- [ ] `browsers/browsers_spec.ts`

---

## Batch 5 — `browsers/` Firefox + memory profiler (~1288 LOC, 2 files)

- [ ] `browsers/firefox_spec.ts`
- [ ] `browsers/memory/memory_spec.ts`

---

## Batch 6 — `browsers/` Chrome + Electron (~2708 LOC, 2 files)

- [ ] `browsers/chrome_spec.js`
- [ ] `browsers/electron_spec.js`

---

## Batch 7 — `cloud/api/` core HTTP + cy-prompt session (~2874 LOC, 5 files)

- [ ] `cloud/api/api_spec.js`
- [ ] `cloud/api/cloud_request_spec.ts`
- [ ] `cloud/api/cloud_request_encryption_spec.ts`
- [ ] `cloud/api/cy-prompt/get_cy_prompt_bundle_spec.ts`
- [ ] `cloud/api/cy-prompt/post_cy_prompt_session_spec.ts`

---

## Batch 8 — `cloud/api/` cy-prompt report + studio API + artifact (~1165 LOC, 5 files)

- [ ] `cloud/api/cy-prompt/report_cy_prompt_error_spec.ts`
- [ ] `cloud/api/studio/get_studio_bundle_spec.ts`
- [ ] `cloud/api/studio/post_studio_session_spec.ts`
- [ ] `cloud/api/studio/report_studio_error_spec.ts`
- [ ] `cloud/artifacts/print_protocol_upload_error_spec.ts`

---

## Batch 9 — `cloud/studio/` + telemetry (~2377 LOC, 6 files)

- [ ] `cloud/studio/StudioLifecycleManager_spec.ts`
- [ ] `cloud/studio/studio_spec.ts`
- [ ] `cloud/studio/StudioElectron_spec.ts`
- [ ] `cloud/studio/ensure_studio_bundle_spec.ts`
- [ ] `cloud/studio/telemetry/TelemetryManager_spec.ts`
- [ ] `cloud/studio/telemetry/TelemetryReporter_spec.ts`

---

## Batch 10 — `cloud/cy-prompt/` managers (~1112 LOC, 3 files)

- [ ] `cloud/cy-prompt/CyPromptLifecycleManager_spec.ts`
- [ ] `cloud/cy-prompt/CyPromptManager_spec.ts`
- [ ] `cloud/cy-prompt/ensure_cy_prompt_bundle_spec.ts`

---

## Batch 11 — `cloud/` core services (~2617 LOC, 12 files)

- [ ] `cloud/auth_spec.js`
- [ ] `cloud/environment_spec.ts`
- [ ] `cloud/routes_spec.js`
- [ ] `cloud/encryption_spec.js`
- [ ] `cloud/exceptions_spec.js`
- [ ] `cloud/protocol_spec.ts`
- [ ] `cloud/user_spec.js`
- [ ] `cloud/get_cloud_metadata_spec.ts`
- [ ] `cloud/extract_atomic_spec.ts`
- [ ] `cloud/require_script_spec.ts`
- [ ] `cohort_spec.ts`
- [ ] `cache_spec.ts`

---

## Batch 12 — `plugins/` + `modes/` + `gui/` (~2079 LOC, 13 files)

- [ ] `plugins/preprocessor_spec.js`
- [ ] `plugins/util_spec.js`
- [ ] `plugins/run_events_spec.js`
- [ ] `plugins/child/preprocessor_spec.js`
- [ ] `plugins/child/require_async_child_spec.js`
- [ ] `plugins/child/run_require_async_child_spec.js`
- [ ] `plugins/child/validate_event_spec.js`
- [ ] `modes/record_spec.js`
- [ ] `modes/interactive_spec.js`
- [ ] `modes/info_spec.js`
- [ ] `gui/menu_spec.js`
- [ ] `gui/windows_spec.ts`
- [ ] `gui/links_spec.ts`

---

## Batch 13 — `automation/` + project/fixture plumbing (~2310 LOC, 16 files)

- [ ] `automation_spec.js`
- [ ] `automation/util_spec.ts`
- [ ] `automation/commands/key_press_spec.ts`
- [ ] `fixture_spec.ts`
- [ ] `files_spec.ts`
- [ ] `capture_spec.ts`
- [ ] `environment_spec.ts`
- [ ] `exec_spec.ts`
- [ ] `experiments_spec.js`
- [ ] `errors_spec.js`
- [ ] `project_utils_spec.ts`
- [ ] `task_spec.js`
- [ ] `spec_spec.js`
- [ ] `iframes_spec.js`
- [ ] `xhrs_spec.js`
- [ ] `filter_runtime_config_for_recording_spec.js`

---

## Batch 14 — Top-level `config` + `project-base` (~2421 LOC, 2 files)

- [ ] `config_spec.js`
- [ ] `project-base_spec.js`

---

## Batch 15 — Top-level `socket` (~1206 LOC, 1 file)

- [ ] `socket_spec.js`

---

## Batch 16 — Top-level `request` (~1088 LOC, 1 file)

- [ ] `request_spec.js`

---

## Batch 17 — Top-level open, reporter, screenshots, template, exceptions, saved state (~1597 LOC, 6 files)

- [ ] `open_project_spec.js`
- [ ] `reporter_spec.js`
- [ ] `screenshots_spec.js`
- [ ] `template_engine_spec.js`
- [ ] `unhandled_exceptions_spec.js`
- [ ] `saved_state_spec.js`

---

## Reconcile file count

After all boxes are checked, `find test/unit -name '*_spec.ts' -o -name '*_spec.js' | wc -l` should be **0** under `test/unit/`.
