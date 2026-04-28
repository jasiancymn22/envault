# `envault audit` Command

The `audit` command provides a high-level summary of all environments stored in your vault file. It is useful for quickly inspecting the state of your vault without decrypting any secrets.

## Usage

```bash
envault audit [options]
```

## Options

| Option   | Description                        |
|----------|------------------------------------|
| `--json` | Output the audit results as JSON   |

## Output

By default, the command prints a formatted table showing:

- **Environment** — The name of each environment stored in the vault.
- **Keys** — The number of encrypted keys stored in that environment.
- **Has Entries** — Whether the environment contains at least one key (`✔` or `✘`).

A summary line at the bottom shows the total number of keys across all environments.

## Examples

### Standard output

```bash
$ envault audit

Vault: /project/.envault
Environments: 3

Environment         Keys   Has Entries
──────────────────────────────────────────
production          5      ✔
staging             3      ✔
development         0      ✘
──────────────────────────────────────────
Total keys across all environments: 8
```

### JSON output

```bash
$ envault audit --json
[
  { "environment": "production", "keyCount": 5, "hasEntries": true },
  { "environment": "staging",    "keyCount": 3, "hasEntries": true },
  { "environment": "development","keyCount": 0, "hasEntries": false }
]
```

## Notes

- The `audit` command does **not** decrypt any values — it only reads metadata.
- No password is required to run this command.
