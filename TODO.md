# TODO

## Critical
- [x] Fix resume path for expired links by forcing link re-resolution (`task.url = "pending"`) on resume when episode metadata exists.
- [x] Detect `403/404/410` as `ExpiredLink` during content-length probing (`HEAD` and fallback `GET bytes=0-0`).
- [x] Remove potential deadlock in `DownloadManager` pause/resume flow by avoiding lock-order inversion between `jobs` and `cancel_flags`.
- [x] Add automated test coverage for expired-link path (`test_expired_link_without_metadata_pauses_task`).
- [ ] Add full end-to-end refresh test: first URL expired, refreshed URL succeeds on resume.

## High
- [x] Replace noisy `println!`-based logging in core/Tauri paths with structured `tracing` logs and consistent log levels.
- [ ] Refactor `aura-core/src/manager.rs`: split large worker function into smaller units (URL lifecycle, segment state machine, progress ticker, merge/finalize).
- [x] Add retry/backoff strategy for transient network failures (timeouts, connection resets) instead of immediate task error/paused state.
- [ ] Add explicit cancellation tests for immediate pause during active segment download.

## Medium
- [x] Replace `ViewState.data?: any` in `src/App.tsx` with a typed view-state union.
- [x] Standardize status mapping/types between Rust and TypeScript (strict `TaskStatusKind` parser return).
- [x] Remove duplicate section comments and cleanup command wiring organization in `src-tauri/src/lib.rs`.
- [ ] Document queue semantics in UI path (job identity/merge behavior) and align with CLI behavior.

## Product/UI
- [ ] Fix Android notch/safe-area overlap in mobile layout.
- [ ] Preserve search results, query, and scroll position when navigating back from details view.
- [ ] Replace placeholder notifications with real notification service.
- [ ] Split completed downloads into a history/archive section instead of active queue.
