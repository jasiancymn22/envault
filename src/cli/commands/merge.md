# `merge` Command

Merge environment variables from one environment into another within the vault.

## Usage

```bash
envault merge <source> <target> [options]
```

## Arguments

| Argument | Description                          |
|----------|--------------------------------------|
| source   | The environment to copy values from  |
| target   | The environment to merge values into |

## Options

| Option              | Description                                      | Default    |
|---------------------|--------------------------------------------------|------------|
| `-f, --file <path>` | Path to the vault file                           | `.envault` |
| `--overwrite`       | Overwrite existing keys in the target environment | `false`    |

## Behavior

- By default, only keys **not present** in the target are added.
- With `--overwrite`, all keys from source will overwrite matching keys in target.
- Both environments must exist in the vault.
- You will be prompted for the vault password once.

## Examples

```bash
# Merge development into staging (no overwrite)
envault merge development staging

# Merge development into production, overwriting existing keys
envault merge development production --overwrite

# Use a custom vault file
envault merge development staging --file ./config/.envault
```

## Notes

- The source environment is **not modified**.
- The `updatedAt` timestamp of the target is updated after a successful merge.
