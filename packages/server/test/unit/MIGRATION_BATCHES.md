# Mocha `*_spec` → Vitest `*.spec.ts` migration tracker

Scope: legacy unit tests under `packages/server/test/unit/` matching `**/*_spec.{js,ts}` (Mocha). Vitest runs `**/*.spec.{js,ts}` and ignores `*_spec` (see `vitest.config.ts`).

**Convention:** When a file is migrated, add `foo.spec.ts`, delete `foo_spec.ts`, run `yarn workspace @packages/server test-unit-vitest -- <path>`, and check the box below.

**Totals (baseline):** ~105 files, ~34.4k LOC — batches target **~2.8k–3.5k LOC** each for reviewable PRs, grouped by theme.

---

## Progress summary

| Batch | Theme                         | ~LOC  | Files | Done |
| ----- | ----------------------------- | ----- | ----- | ---- |
| 1     | `util/`                       | ~4320 | 21    | [ ]  |
| 2     | `browsers/` — BiDi + CDP base | ~2860 | 5     | [ ]  |
| 3     | `browsers/` — CRI + matrix  | ~3190 | 7     | [ ]  |
| 4     | `browsers/` — Chrome, Electron, memory | ~3440 | 3 | [ ]  |
| 5     | `cloud/api/`                  | ~6410 | 10    | [ ]  |
| 6     | `cloud/studio/` + telemetry   | ~3270 | 6     | [ ]  |
| 7     | `cloud/cy-prompt/` managers     | ~1060 | 3     | [ ]  |
| 8     | `cloud/` — core (auth, routes, env, …) | ~3200 | 12 | [ ]  |
| 9     | `plugins/` + `modes/` + `gui/` | ~3870 | 13   | [ ]  |
| 10    | `automation/` + fixtures + misc small | ~2500 | 15 | [ ]  |
| 11    | Top-level — core server & I/O | ~7250 | 10    | [ ]  |

*Batches 5 and 11 are larger than the target; split into sub-PRs if reviews are too heavy (e.g. `api_spec.js` alone is ~1.7k LOC).*

---

## Batch 1 — `util/` (~4320 LOC, 21 files)

- [ ] `util/args_spec.js`
- [ ] `util/ci_provider_spec.js`
- [ ] `util/file_spec.ts`
- [ ] `util/commit-info_spec.ts`
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

## Batch 2 — `browsers/` BiDi + CDP plumbing (~2860 LOC, 5 files)

- [ ] `browsers/bidi_automation_spec.ts`
- [ ] `browsers/cdp-connection_spec.ts`
- [ ] `browsers/protocol_spec.ts`
- [ ] `browsers/memory/default_spec.ts`
- [ ] `browsers/memory/cgroup-v1_spec.ts`

---

## Batch 3 — `browsers/` CRI, launchers, Firefox line (~3190 LOC, 7 files)

- [ ] `browsers/cdp_automation_spec.ts`
- [ ] `browsers/browser-cri-client_spec.ts`
- [ ] `browsers/privileged-channel_spec.js`
- [ ] `browsers/webkit_spec.ts`
- [ ] `browsers/firefox-util_spec.ts`
- [ ] `browsers/browsers_spec.ts`
- [ ] `browsers/firefox_spec.ts`

---

## Batch 4 — `browsers/` Chrome, Electron, memory profiler (~3440 LOC, 3 files)

- [ ] `browsers/chrome_spec.js`
- [ ] `browsers/electron_spec.js`
- [ ] `browsers/memory/memory_spec.ts`

---

## Batch 5 — `cloud/api/` (~6410 LOC, 10 files)

*Consider splitting: e.g. first PR `api_spec` + encryption + cloud_request; second PR cy-prompt + studio API.*

- [ ] `cloud/api/api_spec.js`
- [ ] `cloud/api/cloud_request_spec.ts`
- [ ] `cloud/api/cloud_request_encryption_spec.ts`
- [ ] `cloud/api/cy-prompt/get_cy_prompt_bundle_spec.ts`
- [ ] `cloud/api/cy-prompt/post_cy_prompt_session_spec.ts`
- [ ] `cloud/api/cy-prompt/report_cy_prompt_error_spec.ts`
- [ ] `cloud/api/studio/get_studio_bundle_spec.ts`
- [ ] `cloud/api/studio/post_studio_session_spec.ts`
- [ ] `cloud/api/studio/report_studio_error_spec.ts`
- [ ] `cloud/artifacts/print_protocol_upload_error_spec.ts`

---

## Batch 6 — `cloud/studio/` + telemetry (~3270 LOC, 6 files)

- [ ] `cloud/studio/StudioLifecycleManager_spec.ts`
- [ ] `cloud/studio/studio_spec.ts`
- [ ] `cloud/studio/StudioElectron_spec.ts`
- [ ] `cloud/studio/ensure_studio_bundle_spec.ts`
- [ ] `cloud/studio/telemetry/TelemetryManager_spec.ts`
- [ ] `cloud/studio/telemetry/TelemetryReporter_spec.ts`

---

## Batch 7 — `cloud/cy-prompt/` managers (~1060 LOC, 3 files)

- [ ] `cloud/cy-prompt/CyPromptLifecycleManager_spec.ts`
- [ ] `cloud/cy-prompt/CyPromptManager_spec.ts`
- [ ] `cloud/cy-prompt/ensure_cy_prompt_bundle_spec.ts`

---

## Batch 8 — `cloud/` core services (~3200 LOC, 12 files)

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

## Batch 9 — `plugins/` + `modes/` + `gui/` (~3870 LOC, 13 files)

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

## Batch 10 — `automation/` + project/fixture plumbing (~2500 LOC, 15 files)

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

---

## Batch 11 — Top-level server & I/O (~7250 LOC, 10 files)

*Largest batch by LOC — strong candidates to split into two PRs (e.g. config + socket + request vs screenshots + project-base + open_project).*

- [ ] `config_spec.js`
- [ ] `project-base_spec.js`
- [ ] `socket_spec.js`
- [ ] `request_spec.js`
- [ ] `open_project_spec.js`
- [ ] `reporter_spec.js`
- [ ] `screenshots_spec.js`
- [ ] `template_engine_spec.js`
- [ ] `unhandled_exceptions_spec.js`
- [ ] `saved_state_spec.js`

---

## Reconcile file count

After all boxes are checked, `find test/unit -name '*_spec.ts' -o -name '*_spec.js' | wc -l` should be **0** under `test/unit/`.
