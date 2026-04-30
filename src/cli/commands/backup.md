# `envault backup`

Create a timestamped backup of your vault file.

## Usage

```bash
envault backup [options]
```

## Options

| Option | Description | Default |
|---|---|---|
| `-v, --vault <path>` | Path to the vault file | `.envault` |
| `-o, --output <dir>` | Directory to write the backup file | `.` (current directory) |
| `--no-password` | Skip password verification before creating the backup | — |

## Description

The `backup` command copies your vault file to a specified output directory with a timestamped filename. By default, it prompts for your vault password to verify access before proceeding.

Backup filenames follow the pattern:

```
<vault-name>.backup-<ISO-timestamp>.json
```

For example:

```
.envault.backup-2024-06-15T10-30-00-000Z.json
```

## Examples

### Create a backup in the current directory

```bash
envault backup
```

### Create a backup in a specific directory

```bash
envault backup --output ./backups
```

### Skip password prompt (e.g., in CI scripts)

```bash
envault backup --no-password --output /var/backups/envault
```

## Notes

- The output directory will be created automatically if it does not exist.
- The original vault file is **not** modified.
- Use `--no-password` carefully in automated environments to avoid exposing secrets.
