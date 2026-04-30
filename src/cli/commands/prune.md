# `envault prune`

Remove empty environments from the vault to keep it clean and organized.

## Usage

```bash
envault prune [options]
```

## Options

| Option            | Description                                      | Default    |
|-------------------|--------------------------------------------------|------------|
| `-f, --file`      | Path to the vault file                           | `.envault` |
| `-y, --yes`       | Skip the confirmation prompt                     | `false`    |
| `--dry-run`       | Preview what would be pruned without changes     | `false`    |

## Description

The `prune` command scans all environments in the vault and removes any that contain zero keys. This is useful for cleaning up environments that were created but never populated, or that had all their keys removed via `envault remove`.

## Examples

### Preview empty environments

```bash
envault prune --dry-run
```

Outputs which environments would be removed without making any changes.

### Prune with confirmation

```bash
envault prune
```

Lists empty environments and asks for confirmation before removing them.

### Prune without confirmation

```bash
envault prune --yes
```

Skips the confirmation prompt and immediately removes all empty environments.

### Use a custom vault file

```bash
envault prune --file ./config/.envault --yes
```

## Notes

- An environment is considered empty if it has no keys, regardless of whether it was previously populated.
- This operation is irreversible. Use `--dry-run` to preview changes before committing.
- Consider running `envault backup` before pruning to preserve a snapshot of the vault.
