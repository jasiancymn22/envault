# `envault diff` Command

Compare the key-value pairs between two environments stored in the vault.

## Usage

```bash
envault diff <env1> <env2> [options]
```

## Arguments

| Argument | Description                          |
|----------|--------------------------------------|
| `env1`   | The base environment to compare from |
| `env2`   | The target environment to compare to |

## Options

| Option              | Default    | Description              |
|---------------------|------------|--------------------------|
| `-v, --vault <path>`| `.envault` | Path to the vault file   |

## Output Format

Lines prefixed with `-` (red) exist only in `env1` or have a different value.
Lines prefixed with `+` (green) exist only in `env2` or carry the updated value.
Keys present in both environments with identical values are not shown.

## Example

```bash
$ envault diff development production
Enter vault password: ****

Diff: development → production

- DATABASE_URL=postgres://localhost/dev
+ DATABASE_URL=postgres://prod-host/app
- DEBUG=true
+ LOG_LEVEL=warn
```

## Notes

- Both environments must exist in the vault.
- You will be prompted for the vault password to decrypt both environments.
- The password must be the same for both environments (shared vault password).
