# Versioning

Aura uses a single source of truth for release version:

- `VERSION`

## How it works

`bun run version:sync` updates:

- `package.json` -> `version`
- `src-tauri/tauri.conf.json` -> `version`
- `src-tauri/Cargo.toml` -> `[package].version`

Build scripts already run this automatically before build/dev commands.

## Release flow

1. Edit `VERSION` (for example `0.0.5`).
2. Commit.
3. Create matching tag:

```bash
git tag v0.0.5
git push origin v0.0.5
```

CI validates that tag and `VERSION` match exactly.
