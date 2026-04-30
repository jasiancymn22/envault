# `share` Command

Securely share a specific environment with a teammate using a one-time share password.

## Usage

```bash
# Export an environment to a shareable file
envault share <environment> <outputFile> [options]

# Import a shared environment file into your vault
envault share-import <shareFile> <environment> [options]
```

## Arguments

### `share`
| Argument | Description |
|---|---|
| `environment` | Name of the environment to share (e.g. `production`) |
| `outputFile` | Path to write the encrypted share file (e.g. `prod-share.json`) |

### `share-import`
| Argument | Description |
|---|---|
| `shareFile` | Path to the received share file |
| `environment` | Name to assign the environment in your vault |

## Options

| Flag | Default | Description |
|---|---|---|
| `-v, --vault <path>` | `.envault` | Path to the vault file |

## How It Works

1. **Sharing**: The environment is decrypted with your vault password, then re-encrypted with a separate share password you choose. The resulting file can be safely sent to a teammate.
2. **Importing**: Your teammate decrypts the share file using the share password you communicated, then re-encrypts it with their own vault password.

> **Security tip**: Never send the share password and the share file through the same channel. Use email for the file and a messaging app for the password, for example.

## Example

```bash
# Alice shares the staging environment
envault share staging staging-share.json
# Vault password: ••••••••
# Share password: ••••••••
# Confirm share password: ••••••••
# Shared environment "staging" written to staging-share.json

# Bob imports it into his vault
envault share-import staging-share.json staging
# Share password: ••••••••
# Vault password: ••••••••
# Environment "staging" imported successfully from staging-share.json
```
