# `envault history`

Display the change history recorded in the vault file.

## Usage

```bash
envault history [options]
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--env <environment>` | `-e` | Filter history by environment name | all |
| `--limit <number>` | `-n` | Maximum number of entries to display | 20 |
| `--no-password` | | Skip password prompt | false |

## Examples

### Show recent history

```bash
envault history
```

Outputs the last 20 change events across all environments.

### Filter by environment

```bash
envault history --env production
```

### Increase the limit

```bash
envault history --limit 50
```

## Output Format

```
Vault History (last 3 entries):
────────────────────────────────────────────────────────────
    1. [1/16/2024, 10:00:00 AM] ROTATE   production
    2. [1/15/2024, 9:00:00 AM]  REMOVE   staging [OLD_KEY]
    3. [1/14/2024, 8:00:00 AM]  SET      dev [DB_URL]
────────────────────────────────────────────────────────────
```

## Notes

- History is stored inside the encrypted vault file and is only accessible with the correct password.
- History entries are written automatically by `set`, `remove`, `rotate`, and other mutating commands.
- Entries are displayed in reverse chronological order (newest first).
