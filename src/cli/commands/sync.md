# sync command

Sync a vault environment to a local `.env` file.

## Usage

```bash
envault sync <environment> <targetFile> [options]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `environment` | The vault environment name to sync from  |
| `targetFile`  | The target `.env` file path to write to  |

## Options

| Option                  | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if omitted)     |
| `--vault <path>`        | Path to vault file (default: `.envault`) |
| `--dry-run`             | Preview changes without writing          |

## Examples

```bash
# Sync production environment to .env.production
envault sync production .env.production

# Sync with password flag
envault sync staging .env --password mysecret

# Preview what would be written
envault sync production .env --dry-run

# Use a custom vault path
envault sync production .env --vault ./config/.envault
```

## Notes

- The target file will be **overwritten** with the decrypted contents.
- Use `--dry-run` to preview the contents before writing.
- Ensure the vault file exists and the environment is present before syncing.
