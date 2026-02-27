# Aura Desktop - Current Status

## Architecture Snapshot
- `src/`: React + TypeScript frontend with TanStack Query polling and Tauri invoke bridge.
- `src-tauri/`: Tauri v2 backend exposing commands to frontend and hosting `aura-core`.
- `aura-core/`: Rust library for AnimeHeaven scraping, queue persistence, segmented downloading, and task state handling.
- Storage:
  - Settings persisted in `settings.json` under app config directory.
  - Jobs persisted in `jobs.json` under app config directory.

## Feature Status Matrix
| Area | Status | Notes |
|---|---|---|
| Anime search | Working | Uses scraper endpoint integration via Tauri command. |
| Season details + episodes | Working | Includes episode metadata needed for queueing. |
| Queue creation | Working | Jobs and tasks created from selected episodes. |
| Segmented download engine | Working | Segments tracked per task with completion merge. |
| Download persistence | Working | Jobs reload across restarts; downloading state reset to pending on startup. |
| Download settings | Working | Download directory and concurrency settings are persisted. |
| Pause/resume controls | Fixed | Exposed in Tauri + frontend (per-job and per-episode). |
| Immediate pause behavior | Fixed | Cooperative cancellation now checks per-chunk and interrupts active segment best-effort. |

## What Was Fixed First
- Pause/resume is now implemented end-to-end:
  - New Tauri commands: `pause_download`, `resume_download`.
  - Frontend API wrappers: `pauseDownload`, `resumeDownload`.
  - Downloads UI now has:
    - Job-level `Pause All` / `Resume All`.
    - Task-level `Pause` / `Resume`.
  - `aura-core` now supports cooperative cancellation flags to stop active downloads quickly when paused.

## Known Issues and Risks
- Android notch/safe-area overlap remains open.
- Search state/history preservation across back navigation remains open.
- Notification service is still placeholder-level.
- Completed-job archiving/history flow is not implemented yet (active list cleanup pending).
- Build/test verification is environment-limited when crates/npm registry access is unavailable.

## Next Priority Candidates
1. Android safe-area/notch overlap fix in mobile layout.
2. Navigation history + search-result/scroll restoration.
3. Move completed downloads from active queue to a history view.
