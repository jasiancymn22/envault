# `clone` Command

Clone an existing environment to a new environment name within the same vault file.

## Usage

```bash
envault clone <source-env> <target-env> [options]
```

## Arguments

| Argument | Description |
|---|---|
| `source-env` | The name of the environment to clone from |
| `target-env` | The name of the new environment to create |

## Options

| Option | Default | Description |
|---|---|---|
| `-f, --vault-file <path>` | `.envault` | Path to the vault file |

## Description

The `clone` command decrypts the source environment using the provided password
and re-encrypts its contents into a new environment entry with a freshly
generated salt. Both environments share the same password after cloning.

This is useful when you want to bootstrap a new environment (e.g., `staging`)
from an existing one (e.g., `production`) without manually copying each key.

## Example

```bash
# Clone production into a new staging environment
envault clone production staging

# Using a custom vault file
envault clone production staging --vault-file ./secrets/.envault
```

## Notes

- The source environment **must** exist in the vault.
- The target environment **must not** already exist.
- A new salt is generated for the cloned environment.
- The password used to decrypt the source is also used to encrypt the clone.
