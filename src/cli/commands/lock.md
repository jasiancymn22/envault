# `lock` / `unlock` Commands

The `lock` and `unlock` commands allow you to protect your vault from accidental reads or writes by placing a lock file alongside the vault.

## Usage

```bash
# Lock the vault
envault lock

# Unlock the vault
envault unlock
```

## How It Works

- **lock**: Creates a `.envault.lock` file in the same directory as your vault file. While locked, other commands that check `isVaultLocked()` will refuse to operate on the vault.
- **unlock**: Prompts for the master password, verifies the vault can be read, then removes the `.envault.lock` file.

## Lock File

The lock file is stored at `.envault.lock` next to your vault file. It contains the ISO timestamp of when the lock was applied.

> **Note**: Add `.envault.lock` to your `.gitignore` to avoid committing lock state.

## Examples

```bash
# Lock before stepping away
envault lock
# Vault locked successfully.

# Unlock when ready to continue
envault unlock
# Master password: ****
# Vault unlocked successfully.
```

## Error Handling

- Locking a vault that does not exist will print an error and exit.
- Locking an already-locked vault will notify you without error.
- Unlocking a vault that is not locked will notify you without error.
