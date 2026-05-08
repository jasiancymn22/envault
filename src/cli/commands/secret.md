# `envault secret` — Manage Individual Secrets with Metadata

The `secret` subcommand allows fine-grained management of individual secrets within a vault environment. Unlike the bulk `set`/`get` commands, `secret` supports attaching metadata such as **tags** and **descriptions** to each value.

## Subcommands

### `secret set <environment> <key> <value>`

Encrypt and store a secret. Prompts for the vault password.

```bash
envault secret set production DB_URL "postgres://localhost/mydb" \
  --tags db,infrastructure \
  --description "Primary database connection string"
```

**Options:**
- `-t, --tags <tags>` — Comma-separated list of tags
- `-d, --description <desc>` — Human-readable description
- `-f, --file <path>` — Vault file path (default: `.envault`)

---

### `secret get <environment> <key>`

Decrypt and print a secret value to stdout. Prompts for the vault password.

```bash
envault secret get production DB_URL
```

**Options:**
- `-f, --file <path>` — Vault file path (default: `.envault`)

---

### `secret tag <environment> <key> <tags>`

Update the tags on an existing secret without re-encrypting.

```bash
envault secret tag production DB_URL "db,primary,critical"
```

**Options:**
- `-f, --file <path>` — Vault file path (default: `.envault`)

---

### `secret search <tag>`

List all secrets across all environments that match a given tag.

```bash
envault secret search db
# [production] DB_URL — Primary database connection string
# [staging] DB_URL
```

**Options:**
- `-f, --file <path>` — Vault file path (default: `.envault`)

---

## Notes

- Secrets are stored inside the vault file under the `secrets` array alongside the standard encrypted env entries.
- Tags and descriptions are stored in plaintext metadata; only the secret **value** is encrypted.
- Use `envault audit` to review secrets that are missing descriptions or tags.
