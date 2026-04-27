# `rename` Command

Rename an existing environment within the vault without modifying its encrypted contents.

## Usage

```bash
envault rename <oldEnv> <newEnv> [options]
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `oldEnv`  | The current name of the environment |
| `newEnv`  | The new name for the environment   |

## Options

| Flag              | Description                        | Default     |
|-------------------|------------------------------------|-------------|
| `-f, --file <path>` | Path to the vault file           | `.envault`  |

## Examples

### Rename `staging` to `production`

```bash
envault rename staging production
```

### Rename using a custom vault file

```bash
envault rename dev qa --file ./secrets/.envault
```

## Notes

- The command does **not** require a password, as it only modifies the environment key in the vault metadata — the encrypted payload is preserved as-is.
- If `<oldEnv>` does not exist, the command will exit with an error.
- If `<newEnv>` already exists, the command will exit with an error to prevent accidental overwrites.
