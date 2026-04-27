# `rotate` Command

Re-encrypts all vault entries (or a specific environment) with a new password.

## Usage

```bash
# Rotate password for all environments
envault rotate

# Rotate password for a specific environment
envault rotate --env production
```

## Options

| Option | Alias | Description |
|---|---|---|
| `--env <environment>` | `-e` | Rotate only the specified environment |

## How It Works

1. Reads the existing vault file.
2. Prompts for the **current** password.
3. Prompts for the **new** password (with confirmation).
4. Decrypts each environment entry using the old password.
5. Re-encrypts each entry using the new password (preserving the original salt).
6. Writes the updated vault back to disk.

## Security Notes

- The original salt is preserved during rotation to maintain key derivation consistency.
- If decryption fails for any environment, the command aborts without writing changes.
- Passwords are never stored; they are only held in memory during the rotation process.

## Example

```
$ envault rotate
Enter current password: ********
Enter new password: **********
Confirm new password: **********
Successfully rotated password for 3 environment(s).
```
