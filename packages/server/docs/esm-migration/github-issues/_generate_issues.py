#!/usr/bin/env python3
"""Regenerate GitHub issue bodies in this directory. Not run in CI."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERVER = ROOT.parents[2]  # packages/server
PLAN = "server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)"

FOOTER = f"""
## References

- Parent plan: `{PLAN}` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.
"""


def write_issue(filename: str, title: str, stream: str, chunk: str, loc: str, scope: str, files: list[str] | None, parallelism: str, deps: str, acceptance: list[str]) -> None:
    file_list = ""
    if files:
        file_list = "\n".join(f"- `{f}`" for f in files)
        file_list = f"\n## Files\n\n{file_list}\n"
    body = f"""# {title}

**Stream:** {stream}  
**Chunk:** {chunk}  
**LOC budget:** {loc}

## Summary

{scope}
{file_list}
## Parallelism / ordering

{parallelism}

## Depends on

{deps}

## Acceptance criteria

{chr(10).join(f"- {a}" for a in acceptance)}
{FOOTER}
"""
    (ROOT / filename).write_text(body)


def main() -> None:
    # --- C1 ---
    write_issue(
        "c1-1-runner-entry-eslint.md",
        "[ESM] @packages/server C1.1 — Test runner, entries, ESLint (~527 LOC)",
        "A (tooling)",
        "C1.1",
        "~527",
        "Prepare ESM-friendly test execution and entry stubs without flipping package `type` yet.",
        [
            "packages/server/test/scripts/run.js",
            "packages/server/test/spec_helper.js",
            "packages/server/index.js",
            "packages/server/start-cypress.js",
            "packages/server/hook-require.js",
            "packages/server/eslint.config.ts",
        ],
        "Parallel with C1.2–C1.7, C1.8 batches, and design work on Streams B–C.",
        "None.",
        [
            "Mocha / runner can load specs during transition (document loader or dual mode).",
            "No `package.json` `type: module` in this PR unless explicitly part of merge gate.",
            "`yarn workspace @packages/server test-unit -- <spec>` still passes for unaffected specs.",
        ],
    )

    write_issue(
        "c1-2-reporter-request.md",
        "[ESM] @packages/server C1.2 — `reporter.js` + `request.js` (~1528 LOC)",
        "A (tooling)",
        "C1.2",
        "~1528",
        "Migrate large CJS modules toward ESM-compatible patterns (syntax + imports) per plan.",
        [
            "packages/server/lib/reporter.js",
            "packages/server/lib/request.js",
        ],
        "Parallel with other C1.* chunks; avoid overlapping edits with same files.",
        "None.",
        [
            "Both modules use `import`/`export` or agreed interim pattern consistent with package strategy.",
            "Unit tests touching these modules still pass.",
        ],
    )

    write_issue(
        "c1-3-plugins-child-small-js.md",
        "[ESM] @packages/server C1.3 — Plugin child processes + small `lib` JS (~1109 LOC)",
        "A (tooling)",
        "C1.3",
        "~1109",
        "Child-process and privileged-channel code: document and implement ESM/CJS boundary (e.g. `.cjs`, `createRequire`, or spawn flags).",
        [
            "packages/server/lib/task.js",
            "packages/server/lib/template_engine.js",
            "packages/server/lib/privileged-commands/*.js",
            "packages/server/lib/plugins/child/*.js",
        ],
        "Parallel with C1.*; coordinate if changing how children are spawned from `index.js`.",
        "Prefer C1.1 merged if spawn / entry behavior changes.",
        [
            "Explicit strategy for plugin child ESM vs CJS documented in PR description.",
            "Plugin child tests under `test/unit/plugins/child/` still pass.",
        ],
    )

    write_issue(
        "c1-4-util-js.md",
        "[ESM] @packages/server C1.4 — All `lib/util/*.js` (~2420 LOC)",
        "A (tooling)",
        "C1.4",
        "~2420",
        "Convert utility `.js` files under `lib/util/` to the agreed ESM pattern in one bounded chunk.",
        None,
        "Parallel with C1.* ; single directory — one assignee recommended to reduce conflicts.",
        "None.",
        [
            "All `packages/server/lib/util/*.js` migrated per team convention.",
            "`wc -l` on touched files stays within ~2500 LOC budget (re-split if needed).",
        ],
    )

    c1_5 = [
        "test/unit/util/app_data_spec.js",
        "test/unit/util/args_spec.js",
        "test/unit/util/async_retry_spec.ts",
        "test/unit/util/cache_buster_spec.js",
        "test/unit/util/chrome_policy_check.js",
        "test/unit/util/chromium_flags_spec.js",
    ]
    write_issue(
        "c1-5-unit-util-specs-batch-a.md",
        "[ESM] @packages/server C1.5 — `test/unit/util` specs batch A (~1337 LOC)",
        "A (tooling)",
        "C1.5",
        "~1337",
        "Topological-only util specs (not in `blockedByCycles`).",
        [f"packages/server/{f}" for f in c1_5],
        "Parallel with C1.6, C1.7, other C1.8 batches.",
        "None.",
        [
            "Listed specs run under the post–C1.1 runner assumptions.",
            "Imports updated for ESM if parent package rules require extensions or default exports.",
        ],
    )

    c1_6 = [
        "test/unit/util/ci_provider_spec.js",
        "test/unit/util/commit-info_spec.ts",
        "test/unit/util/duration_spec.js",
        "test/unit/util/editors_spec.ts",
        "test/unit/util/electron-app_spec.js",
        "test/unit/util/ensure_url_spec.ts",
        "test/unit/util/file_spec.ts",
        "test/unit/util/find_process_spec.ts",
        "test/unit/util/human_time_spec.js",
        "test/unit/util/newlines_spec.ts",
    ]
    write_issue(
        "c1-6-unit-util-specs-batch-b.md",
        "[ESM] @packages/server C1.6 — `test/unit/util` specs batch B (~2491 LOC)",
        "A (tooling)",
        "C1.6",
        "~2491",
        "Topological-only util specs batch B.",
        [f"packages/server/{f}" for f in c1_6],
        "Parallel with C1.5, C1.7, C1.8 batches.",
        "None.",
        [
            "All listed specs pass.",
            "If `wc -l` exceeds 2500 after upstream edits, split follow-up issue.",
        ],
    )

    c1_7 = [
        "test/unit/util/obj_utils_spec.ts",
        "test/unit/util/process_profiler_spec.ts",
        "test/unit/util/profile_cleaner_spec.js",
        "test/unit/util/random_spec.ts",
        "test/unit/util/settings_spec.js",
        "test/unit/util/socket_allowed_spec.ts",
        "test/unit/util/stream_buffer_spec.js",
        "test/unit/util/suppress_warnings_spec.ts",
        "test/unit/util/terminal_spec.ts",
        "test/unit/util/trash_spec.ts",
        "test/unit/util/tty_spec.ts",
    ]
    write_issue(
        "c1-7-unit-util-specs-batch-c.md",
        "[ESM] @packages/server C1.7 — `test/unit/util` specs batch C (~1141 LOC)",
        "A (tooling)",
        "C1.7",
        "~1141",
        "Topological-only util specs batch C.",
        [f"packages/server/{f}" for f in c1_7],
        "Parallel with C1.5, C1.6, C1.8 batches.",
        "None.",
        [
            "All listed specs pass.",
        ],
    )

    # C1.8 batches (excluding C1.1 files and util/*)
    c1_8_batches: list[tuple[str, str, int, list[str]]] = [
        (
            "c1-8-http-requests-integration-spec.md",
            "[ESM] @packages/server C1.8 — `http_requests_spec.js` only (~4922 LOC, exceeds budget)",
            4922,
            ["test/integration/http_requests_spec.js"],
        ),
        (
            "c1-8-integration-cli-cypress-cloud.md",
            "[ESM] @packages/server C1.8 — Integration: CLI, Cypress, cloud extract (~2382 LOC)",
            2382,
            [
                "test/integration/cli_spec.js",
                "test/integration/cloud/extract_atomic_spec.ts",
                "test/integration/cypress_spec.js",
            ],
        ),
        (
            "c1-8-integration-server-websocket-performance.md",
            "[ESM] @packages/server C1.8 — Integration + perf + mockery (~2335 LOC)",
            2335,
            [
                "test/integration/server_spec.js",
                "test/integration/video_capture_spec.ts",
                "test/integration/websockets_spec.js",
                "test/mockery_helper.ts",
                "test/performance/cy_visit_performance_spec.js",
            ],
        ),
        (
            "c1-8-fixtures-support-automation-specs.md",
            "[ESM] @packages/server C1.8 — Fixtures, support helpers, automation specs (~1153 LOC)",
            1153,
            [
                "test/performance/proxy_performance_spec.js",
                "test/specUtils.ts",
                "test/support/fixtures/ajax/app.js",
                "test/support/fixtures/cloud/cy-prompt/test-cy-prompt.ts",
                "test/support/fixtures/cloud/encryption/index.js",
                "test/support/fixtures/cloud/environment/test-project/child.js",
                "test/support/fixtures/cloud/environment/test-project/grandchild.js",
                "test/support/fixtures/cloud/environment/test-project/index.js",
                "test/support/fixtures/cloud/protocol/test-protocol.ts",
                "test/support/fixtures/cloud/studio/test-studio.ts",
                "test/support/fixtures/example_generated_file.js",
                "test/support/fixtures/example_source.js",
                "test/support/fixtures/ids/todos_test1_expected.js",
                "test/support/fixtures/server/commonjs_dep.js",
                "test/support/fixtures/server/es2015_dep.jsx",
                "test/support/fixtures/server/es2015_root.js",
                "test/support/fixtures/server/sample.js",
                "test/support/fixtures/server/syntax_error.js",
                "test/support/helpers/data-context-helper.ts",
                "test/support/helpers/deferred.ts",
                "test/support/helpers/electron_stub.js",
                "test/unit/append_electron_switches_spec.ts",
                "test/unit/automation/util_spec.ts",
                "test/unit/automation_spec.js",
            ],
        ),
        (
            "c1-8-unit-browser-chrome-spec.md",
            "[ESM] @packages/server C1.8 — `chrome_spec.js` (~1468 LOC)",
            1468,
            ["test/unit/browsers/chrome_spec.js"],
        ),
        (
            "c1-8-unit-browser-electron-memory.md",
            "[ESM] @packages/server C1.8 — Electron + memory browser specs (~1786 LOC)",
            1786,
            [
                "test/unit/browsers/electron_spec.js",
                "test/unit/browsers/memory/cgroup-v1_spec.ts",
                "test/unit/browsers/memory/default_spec.ts",
                "test/unit/browsers/privileged-channel_spec.js",
                "test/unit/cache_spec.ts",
                "test/unit/capture_spec.ts",
            ],
        ),
        (
            "c1-8-unit-cloud-api-session-artifacts.md",
            "[ESM] @packages/server C1.8 — Cloud API session / artifact specs (~2398 LOC)",
            2398,
            [
                "test/unit/cloud/api/api_spec.js",
                "test/unit/cloud/api/cy-prompt/post_cy_prompt_session_spec.ts",
                "test/unit/cloud/api/cy-prompt/report_cy_prompt_error_spec.ts",
                "test/unit/cloud/api/put_protocol_artifact_spec.ts",
                "test/unit/cloud/api/studio/post_studio_session_spec.ts",
            ],
        ),
        (
            "c1-8-unit-cloud-api-errors-metadata.md",
            "[ESM] @packages/server C1.8 — Cloud API errors + metadata specs (~2455 LOC)",
            2455,
            [
                "test/unit/cloud/api/studio/report_studio_error_spec.ts",
                "test/unit/cloud/api/transform_error_spec.ts",
                "test/unit/cloud/api/utils/fake_proxy_server.ts",
                "test/unit/cloud/auth_spec.js",
                "test/unit/cloud/cy-prompt/CyPromptManager_spec.ts",
                "test/unit/cloud/encryption_spec.js",
                "test/unit/cloud/environment_spec.ts",
                "test/unit/cloud/exceptions_spec.js",
                "test/unit/cloud/extract_atomic_spec.ts",
                "test/unit/cloud/get_cloud_metadata_spec.ts",
                "test/unit/cloud/network/fetch_spec.ts",
            ],
        ),
        (
            "c1-8-unit-cloud-network-studio-user.md",
            "[ESM] @packages/server C1.8 — Cloud network, studio, user specs (~2073 LOC)",
            2073,
            [
                "test/unit/cloud/network/is_retryable_error_spec.ts",
                "test/unit/cloud/protocol_spec.ts",
                "test/unit/cloud/require_script_spec.ts",
                "test/unit/cloud/routes_spec.js",
                "test/unit/cloud/studio/StudioElectron_spec.ts",
                "test/unit/cloud/studio/studio_spec.ts",
                "test/unit/cloud/studio/telemetry/TelemetryManager_spec.ts",
                "test/unit/cloud/upload/stream_activity_monitor_spec.ts",
                "test/unit/cloud/user_spec.js",
                "test/unit/cohort_spec.ts",
            ],
        ),
        (
            "c1-8-unit-config-gui-errors-iframes-modes-info.md",
            "[ESM] @packages/server C1.8 — Config, GUI, errors, iframes, modes info (~2438 LOC)",
            2438,
            [
                "test/unit/config_spec.js",
                "test/unit/environment_spec.ts",
                "test/unit/errors_spec.js",
                "test/unit/exec_spec.ts",
                "test/unit/experiments_spec.js",
                "test/unit/filter_runtime_config_for_recording_spec.js",
                "test/unit/gui/links_spec.ts",
                "test/unit/gui/menu_spec.js",
                "test/unit/gui/windows_spec.ts",
                "test/unit/iframes_spec.js",
                "test/unit/modes/info_spec.js",
            ],
        ),
        (
            "c1-8-unit-modes-plugins-open-project.md",
            "[ESM] @packages/server C1.8 — Modes, plugins, open_project specs (~2104 LOC)",
            2104,
            [
                "test/unit/modes/interactive_spec.js",
                "test/unit/modes/record_spec.js",
                "test/unit/open_project_spec.js",
                "test/unit/plugins/child/preprocessor_spec.js",
                "test/unit/plugins/child/require_async_child_spec.js",
                "test/unit/plugins/child/run_child_fixture.js",
                "test/unit/plugins/child/run_plugins_spec.js",
                "test/unit/plugins/child/run_require_async_child_spec.js",
                "test/unit/plugins/child/validate_event_spec.js",
                "test/unit/plugins/preprocessor_spec.js",
                "test/unit/plugins/run_events_spec.js",
                "test/unit/plugins/util_spec.js",
            ],
        ),
        (
            "c1-8-unit-project-reporter-remote.md",
            "[ESM] @packages/server C1.8 — Project base, reporter, remote_states (~2046 LOC)",
            2046,
            [
                "test/unit/project-base_spec.js",
                "test/unit/project_utils_spec.ts",
                "test/unit/remote_states.spec.ts",
                "test/unit/reporter_spec.js",
            ],
        ),
        (
            "c1-8-unit-request-saved-screenshots-server-base.md",
            "[ESM] @packages/server C1.8 — Request, saved_state, screenshots, server-base (~2490 LOC)",
            2490,
            [
                "test/unit/request_spec.js",
                "test/unit/saved_state_spec.js",
                "test/unit/screenshots_spec.js",
                "test/unit/server-base_spec.js",
            ],
        ),
        (
            "c1-8-unit-snapshot-socket-task-remaining.md",
            "[ESM] @packages/server C1.8 — Snapshot, socket, task, template, xhrs (~1573 LOC)",
            1573,
            [
                "test/unit/snapshot_spec.js",
                "test/unit/socket_spec.js",
                "test/unit/spec_spec.js",
                "test/unit/status_code_spec.ts",
                "test/unit/task_spec.js",
                "test/unit/template_engine_spec.js",
                "test/unit/unhandled_exceptions_spec.js",
                "test/unit/xhrs_spec.js",
            ],
        ),
    ]

    for fname, title, loc, rels in c1_8_batches:
        extra = ""
        acceptance = [
            "All listed tests pass under the updated runner.",
        ]
        if loc > 2500:
            extra = (
                "\n\n**Note:** This file alone exceeds the 2500 LOC chunk budget. "
                "Either split the spec file into smaller modules + re-export, "
                "or treat this issue as a dedicated exception with staff-engineer sign-off."
            )
            acceptance.append(
                "Document approach for oversized spec (split vs exception) in PR.",
            )
        write_issue(
            fname,
            title,
            "A (tooling)",
            "C1.8",
            f"~{loc}",
            f"Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).{extra}",
            [f"packages/server/{f}" for f in rels],
            "Parallel with other C1.8 batches and C1.1–C1.7.",
            "C1.1 if runner or spec_helper behavior is required.",
            acceptance,
        )

    # --- C2 (modes SCC, in place) ---
    write_issue(
        "c2-1-modes-upload-results.md",
        "[ESM] @packages/server C2.1 — Modes SCC: upload + pass + results + print protocol error (~624 LOC)",
        "B (modes SCC)",
        "C2.1",
        "~624",
        "Migrate modes/upload SCC **in place** (no graph refactor to remove cycles); convert `require` → `import`/`export` and use dynamic `import()` only if static ESM fails.",
        [
            "packages/server/lib/cloud/artifacts/upload_artifacts.ts",
            "packages/server/lib/modes/pass-with-no-tests.ts",
            "packages/server/lib/modes/results.ts",
            "packages/server/lib/cloud/artifacts/print_protocol_upload_error.ts",
        ],
        "**Recommended before C2.2–C2.4** to reduce merge conflicts; not required to remove the SCC.",
        "None.",
        [
            "ESM syntax + runtime-safe pattern; **no refactor** whose goal is breaking the modes SCC.",
            "Targeted tests pass.",
        ],
    )

    write_issue(
        "c2-2-modes-run.md",
        "[ESM] @packages/server C2.2 — Modes SCC: `run.ts` (~1242 LOC)",
        "B (modes SCC)",
        "C2.2",
        "~1242",
        "Large orchestration file in the small SCC; migrate **in place**.",
        ["packages/server/lib/modes/run.ts"],
        "Prefer after C2.1 or same PR to limit conflicts; parallel OK if ownership is clear.",
        "None (C2.1 optional ordering only).",
        [
            "`modes/run` uses ESM-consistent imports; document dynamic `import()` if required for initialization order.",
            "Run-mode tests still pass.",
        ],
    )

    write_issue(
        "c2-3-modes-record-print-run.md",
        "[ESM] @packages/server C2.3 — Modes SCC: `record.ts` + `print-run.ts` (~1582 LOC)",
        "B (modes SCC)",
        "C2.3",
        "~1582",
        "Pair that shares print/run orchestration; migrate **in place** (SCC may remain).",
        [
            "packages/server/lib/modes/record.ts",
            "packages/server/lib/util/print-run.ts",
        ],
        "Prefer after C2.2 or coordinated single PR; not a cycle-removal gate.",
        "None (C2.2 optional ordering only).",
        [
            "Files migrated in place; static or dynamic imports as needed for correctness.",
            "Relevant tests pass; **SCC count may stay nonzero** in `server-graph`.",
        ],
    )

    write_issue(
        "c2-4-modes-index-info.md",
        "[ESM] @packages/server C2.4 — Modes barrel + `info` (blocked; ~183 LOC)",
        "B (modes SCC)",
        "C2.4",
        "~183",
        "`blockedByCycles` modes entrypoints; migrate when other modes files use agreed ESM pattern (graph may stay cyclic).",
        [
            "packages/server/lib/modes/index.ts",
            "packages/server/lib/modes/info.ts",
        ],
        "After C2.1–C2.3 recommended to avoid barrel churn.",
        "None (optional ordering vs C2.1–C2.3).",
        [
            "`modes/index` and `modes/info` use ESM consistent with package.",
            "No regression in `modes/info_spec` and related tests.",
        ],
    )

    # --- C3 ---
    c3 = [
        (
            "c3-1-automation-scc.md",
            "C3.1",
            "[ESM] @packages/server C3.1 — Automation SCC members (~876 LOC)",
            "~876",
            [
                "lib/automation/automation.ts",
                "lib/automation/commands/get_frame_title.ts",
                "lib/automation/commands/get_url.ts",
                "lib/automation/commands/key_press.ts",
                "lib/automation/commands/navigate_history.ts",
                "lib/automation/commands/reload_frame.ts",
                "lib/automation/cookies.ts",
                "lib/automation/helpers/evaluate_in_frame_context.ts",
                "lib/automation/index.ts",
            ],
        ),
        (
            "c3-2-browsers-cdp-cri.md",
            "C3.2",
            "[ESM] @packages/server C3.2 — CDP + CRI client stack (~1477 LOC)",
            "~1477",
            [
                "lib/browsers/cdp-command-queue.ts",
                "lib/browsers/cdp-connection.ts",
                "lib/browsers/cdp_automation.ts",
                "lib/browsers/cri-client.ts",
            ],
        ),
        (
            "c3-3-browsers-index-utils-memory.md",
            "C3.3",
            "[ESM] @packages/server C3.3 — Browser index, types, utils, memory (~1414 LOC)",
            "~1414",
            [
                "lib/browsers/cri-errors.ts",
                "lib/browsers/index.ts",
                "lib/browsers/types.ts",
                "lib/browsers/utils.ts",
                "lib/browsers/memory/index.ts",
            ],
        ),
        (
            "c3-4-cloud-api-scc.md",
            "C3.4",
            "[ESM] @packages/server C3.4 — Cloud API SCC subset (~1357 LOC)",
            "~1357",
            [
                "lib/cloud/api/axios_middleware/encryption.ts",
                "lib/cloud/api/cloud_request.ts",
                "lib/cloud/api/create_instance.ts",
                "lib/cloud/api/cy-prompt/get_cy_prompt_bundle.ts",
                "lib/cloud/api/index.ts",
                "lib/cloud/api/studio/get_studio_bundle.ts",
                "lib/cloud/api/studio/report_studio_error.ts",
            ],
        ),
        (
            "c3-5-cloud-studio-cy-prompt.md",
            "C3.5",
            "[ESM] @packages/server C3.5 — Cloud encryption, studio, cy-prompt lifecycle (~1531 LOC)",
            "~1531",
            [
                "lib/cloud/encryption.ts",
                "lib/cloud/exception.ts",
                "lib/cloud/user.ts",
                "lib/cloud/cy-prompt/CyPromptLifecycleManager.ts",
                "lib/cloud/cy-prompt/ensure_cy_prompt_bundle.ts",
                "lib/cloud/studio/StudioLifecycleManager.ts",
                "lib/cloud/studio/ensure_studio_bundle.ts",
                "lib/cloud/studio/studio.ts",
                "lib/cloud/studio/telemetry/TelemetryReporter.ts",
                "lib/cloud/studio/StudioElectron.ts",
            ],
        ),
        (
            "c3-6-errors-fixture-plugins-controllers-cookies.md",
            "C3.6",
            "[ESM] @packages/server C3.6 — Errors, fixture, plugins, controllers, cookies (~1023 LOC)",
            "~1023",
            [
                "lib/errors.ts",
                "lib/fixture.ts",
                "lib/plugins/preprocessor.ts",
                "lib/plugins/run_events.ts",
                "lib/util/cookies.ts",
                "lib/controllers/files.ts",
                "lib/controllers/iframes.ts",
                "lib/controllers/spec.ts",
                "lib/controllers/xhrs.ts",
            ],
        ),
        (
            "c3-7-routes-socket.md",
            "C3.7",
            "[ESM] @packages/server C3.7 — Routes + socket stack (~1307 LOC)",
            "~1307",
            [
                "lib/routes.ts",
                "lib/socket-base.ts",
                "lib/socket-ct.ts",
                "lib/socket-e2e.ts",
            ],
        ),
        (
            "c3-8-project-server-base.md",
            "C3.8",
            "[ESM] @packages/server C3.8 — `project-base` + `server-base` (~1844 LOC)",
            "~1844",
            [
                "lib/project-base.ts",
                "lib/server-base.ts",
            ],
        ),
    ]
    for fname, chunk, title, loc, rels in c3:
        write_issue(
            fname,
            title,
            "C (core SCC)",
            chunk,
            loc,
            "Member of the large SCC: migrate **in place**; **SCC may remain**. Use strict file ownership when parallelizing (up to 8 chunks).",
            [f"packages/server/{p}" for p in rels],
            "Up to 8-way parallel with **coordination** on overlapping imports; no prerequisite to remove the SCC.",
            "None (coordinate with Stream B if shared files).",
            [
                "Listed files use ESM-consistent `import`/`export` or documented dynamic `import()` where static cycles are unsafe.",
                "Relevant unit/integration tests pass.",
            ],
        )

    # --- C4 ---
    c4 = [
        (
            "c4-1-bidi-browser-cri.md",
            "C4.1",
            "[ESM] @packages/server C4.1 — Blocked lib: BiDi + browser-cri-client (~1455 LOC)",
            "~1455",
            ["lib/browsers/bidi_automation.ts", "lib/browsers/browser-cri-client.ts"],
        ),
        (
            "c4-2-chrome-electron.md",
            "C4.2",
            "[ESM] @packages/server C4.2 — Blocked lib: Chrome + Electron (~1335 LOC)",
            "~1335",
            ["lib/browsers/chrome.ts", "lib/browsers/electron.ts"],
        ),
        (
            "c4-3-firefox-webkit-protocol.md",
            "C4.3",
            "[ESM] @packages/server C4.3 — Blocked lib: Firefox + WebKit + protocol (~1411 LOC)",
            "~1411",
            [
                "lib/browsers/firefox.ts",
                "lib/browsers/firefox-util.ts",
                "lib/browsers/webkit.ts",
                "lib/browsers/webkit-automation.ts",
                "lib/browsers/protocol.ts",
            ],
        ),
        (
            "c4-4-app-shell.md",
            "C4.4",
            "[ESM] @packages/server C4.4 — Blocked lib: App shell + settings (~1148 LOC)",
            "~1148",
            [
                "lib/cypress.ts",
                "lib/open_project.ts",
                "lib/makeDataContext.ts",
                "lib/runner-ct.ts",
                "lib/util/settings.ts",
                "lib/util/graceful_crash_handling.ts",
            ],
        ),
    ]
    for fname, chunk, title, loc, rels in c4:
        write_issue(
            fname,
            title,
            "D (blocked lib)",
            chunk,
            loc,
            "Downstream of core SCC; migrate **in place** after relevant **C3** chunks for your imports are done.",
            [f"packages/server/{p}" for p in rels],
            "Parallel C4.1–C4.3 after C3; coordinate C4.4 with browser façade PRs.",
            "Relevant C3 chunks migrated in place for modules you import.",
            [
                "ESM migration for listed files complete per convention.",
                "Document dynamic `import()` where required; **SCC may remain** in `server-graph` follow-up.",
            ],
        )

    # --- C5 ---
    c5_batches: list[tuple[str, str, int, list[str]]] = [
        (
            "c5-1-integration-automation-keypress.md",
            "[ESM] @packages/server C5.1 — Blocked tests: integration + key_press (~1093 LOC)",
            1093,
            [
                "test/integration/cdp_spec.ts",
                "test/integration/run_spec.ts",
                "test/unit/automation/commands/key_press.spec.ts",
            ],
        ),
        (
            "c5-2-bidi-automation-spec.md",
            "[ESM] @packages/server C5.2 — Blocked tests: `bidi_automation_spec` (~2401 LOC)",
            2401,
            ["test/unit/browsers/bidi_automation_spec.ts"],
        ),
        (
            "c5-3-browser-cri-cdp-queue-connection.md",
            "[ESM] @packages/server C5.3 — Blocked tests: browser-cri + browsers + CDP queue/connection (~1925 LOC)",
            1925,
            [
                "test/unit/browsers/browser-cri-client_spec.ts",
                "test/unit/browsers/browsers_spec.ts",
                "test/unit/browsers/cdp-command-queue_spec.ts",
                "test/unit/browsers/cdp-connection_spec.ts",
            ],
        ),
        (
            "c5-4-cdp-automation-cri-firefox.md",
            "[ESM] @packages/server C5.4 — Blocked tests: CDP automation + CRI + Firefox (~1845 LOC)",
            1845,
            [
                "test/unit/browsers/cdp_automation_spec.ts",
                "test/unit/browsers/cri-client_spec.ts",
                "test/unit/browsers/firefox-util_spec.ts",
                "test/unit/browsers/firefox_spec.ts",
            ],
        ),
        (
            "c5-5-memory-protocol-cloud-api-artifacts.md",
            "[ESM] @packages/server C5.5 — Blocked tests: memory, protocol, cloud API, artifacts (~2492 LOC)",
            2492,
            [
                "test/unit/browsers/memory/memory_spec.ts",
                "test/unit/browsers/protocol_spec.ts",
                "test/unit/browsers/webkit_spec.ts",
                "test/unit/cloud/api/cloud_request_encryption_spec.ts",
                "test/unit/cloud/api/cloud_request_spec.ts",
                "test/unit/cloud/api/create_instance_spec.ts",
                "test/unit/cloud/api/cy-prompt/get_cy_prompt_bundle_spec.ts",
                "test/unit/cloud/api/studio/get_studio_bundle_spec.ts",
                "test/unit/cloud/artifacts/print_protocol_upload_error_spec.ts",
            ],
        ),
        (
            "c5-6-cloud-lifecycle-specs.md",
            "[ESM] @packages/server C5.6 — Blocked tests: cy-prompt + studio lifecycle (~2402 LOC)",
            2402,
            [
                "test/unit/cloud/cy-prompt/CyPromptLifecycleManager_spec.ts",
                "test/unit/cloud/cy-prompt/ensure_cy_prompt_bundle_spec.ts",
                "test/unit/cloud/studio/StudioLifecycleManager_spec.ts",
                "test/unit/cloud/studio/ensure_studio_bundle_spec.ts",
                "test/unit/cloud/studio/telemetry/TelemetryReporter_spec.ts",
            ],
        ),
        (
            "c5-7-files-fixture-routes.md",
            "[ESM] @packages/server C5.7 — Blocked tests: files, fixture, routes (~942 LOC)",
            942,
            [
                "test/unit/files_spec.ts",
                "test/unit/fixture_spec.ts",
                "test/unit/routes_spec.ts",
            ],
        ),
    ]

    for fname, title, loc, rels in c5_batches:
        write_issue(
            fname,
            title,
            "E (blocked tests)",
            "C5.x",
            f"~{loc}",
            "Specs from `blockedByCycles` in server-graph-toposorted.json; land after corresponding lib work (C3/C4).",
            [f"packages/server/{f}" for f in rels],
            "Parallel C5 batches once imports exist; align with C4 browser and C3 cloud PRs.",
            "Matching production modules migrated (C3/C4).",
            [
                "All listed specs pass.",
            ],
        )

    write_issue(
        "merge-gate-package-type-module.md",
        "[ESM] @packages/server — Merge gate: `type: module`, tsconfig, snapshot, full matrix",
        "Merge gate",
        "MG",
        "N/A (integration)",
        "Final flip after Streams B–D **in-place** migrations and agreed child-process / snapshot behavior.",
        [
            "packages/server/package.json",
            "packages/server/tsconfig.json (and/or packages/ts alignment)",
            "packages/server/index.js",
            "packages/server/start-cypress.js",
            "packages/server/v8-snapshot-entry.js (coordinate tooling)",
        ],
        "Land **after** planned C2, C3, C4 **in-place** work (and typically C5) unless explicit exception.",
        "All planned C2–C4 **in-place** migrations complete; C5 as agreed.",
        [
            "`\"type\": \"module\"` (or equivalent exports strategy) merged with team sign-off.",
            "`yarn workspace @packages/server check-ts` passes.",
            "`test-unit` + `test-integration` pass.",
            "Electron dev path validated per AGENTS.md.",
            "`index.js` `entryPoint` + plugin child behavior documented.",
        ],
    )

    # README index
    issue_files = sorted(p.name for p in ROOT.glob("*.md") if p.name != "README.md" and not p.name.startswith("_"))
    epic_name = "epic-esm-server-migration.md"
    if epic_name in issue_files:
        issue_files = [epic_name] + [f for f in issue_files if f != epic_name]
    child_count = len(issue_files) - (1 if epic_name in issue_files else 0)
    readme = f"""# GitHub issues: @packages/server ESM migration

Each markdown file is **one GitHub issue** (title = first `# ...` heading). Create issues by copying the body (everything below the title) or use `gh issue create`.

**Start here:** create the **[epic](./epic-esm-server-migration.md)** first and link child issues from its checklist (replace `./foo.md` links with `#NNN` after filing).

## Suggested labels

`area/server`, `tech-debt` or `enhancement`, `esm-migration` (create if needed); epic: `epic`

## Issue files (1 epic + {child_count} children)

"""
    for name in issue_files:
        first_line = (ROOT / name).read_text().splitlines()[0]
        readme += f"- [`{name}`](./{name}) — {first_line.lstrip('# ').strip()}\n"

    readme += """
## Regenerate

```bash
python3 packages/server/docs/esm-migration/github-issues/_generate_issues.py
```
"""
    (ROOT / "README.md").write_text(readme)
    print(f"Wrote 1 epic + {child_count} child issue files + README.md")


if __name__ == "__main__":
    main()
