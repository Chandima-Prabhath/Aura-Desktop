# Updater Setup (GitHub Releases)

Aura now uses Tauri updater plugin with a GitHub Release-backed `latest.json`.

## 1. Generate updater signing key

Run locally:

```bash
bunx tauri signer generate -w ~/.tauri/aura.key
```

This prints:
- Public key (safe to share)
- Private key (keep secret)

## 2. Add GitHub repository secrets

Set these in repository Settings -> Secrets and variables -> Actions:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- `TAURI_UPDATER_PUBKEY`

## 3. Ensure workflow runs from version tags

The release workflow triggers on `v*` tags.

Example:

```bash
git tag v0.0.3
git push origin v0.0.3
```

## 4. Updater endpoint

`src-tauri/tauri.conf.json` uses:

- `AURA_UPDATE_ENDPOINT` (set by workflow env)
- `AURA_UPDATER_PUBKEY` (from secret)

Endpoint format:

`https://github.com/<owner>/<repo>/releases/latest/download/latest.json`

## 5. App behavior

- App checks for updates on startup (desktop targets).
- If update exists, notification appears in top bar with `Install` action.
- Install downloads update and relaunches app.
