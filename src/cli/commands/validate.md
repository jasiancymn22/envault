# `envault validate` Command

Validate the structure and contents of one or all environments stored in the vault.

## Usage

```bash
envault validate [environment] [options]
```

## Arguments

| Argument      | Description                                      |
|---------------|--------------------------------------------------|
| `environment` | (Optional) Name of the environment to validate.  |

If no environment is specified, **all environments** in the vault are validated.

## Options

| Option                    | Description                          | Default     |
|---------------------------|--------------------------------------|-------------|
| `-f, --vault-file <file>` | Path to the vault file               | `.envault`  |

## What It Checks

- **Key naming**: All keys must follow valid environment variable naming conventions (`[A-Z_][A-Z0-9_]*`, case-insensitive).
- **Empty values**: Keys with empty or whitespace-only values are reported as warnings.
- **Decryption**: Ensures the vault can be decrypted with the provided password.

## Examples

```bash
# Validate all environments
envault validate

# Validate a specific environment
envault validate production

# Use a custom vault file
envault validate staging --vault-file ./secrets/.envault
```

## Output

```
[✔] production (5 keys)
  ⚠ Empty values: OPTIONAL_FEATURE_FLAG

[✘] staging (3 keys)
  ✘ Invalid key name: "123BAD_KEY"
```

## Exit Codes

| Code | Meaning                                      |
|------|----------------------------------------------|
| `0`  | All validated environments passed            |
| `1`  | One or more environments failed validation   |
