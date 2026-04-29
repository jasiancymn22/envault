# `tag` Command

Manage tags for environments stored in the vault. Tags are arbitrary labels that help organize and describe environments (e.g., `stable`, `wip`, `live`, `deprecated`).

## Usage

```bash
envault tag <environment> [tags...]     # Add one or more tags
envault tag <environment> --list        # List all tags
envault tag <environment> --remove <tag> # Remove a specific tag
```

## Arguments

| Argument      | Description                                  |
|---------------|----------------------------------------------|
| `environment` | The target environment name (required)       |
| `tags...`     | One or more tag names to add (optional)      |

## Options

| Option             | Description                              |
|--------------------|------------------------------------------|
| `-l, --list`       | List all tags for the environment        |
| `-r, --remove <tag>` | Remove a specific tag from the environment |

## Examples

### Add tags
```bash
envault tag production stable live
# Added tag(s) [stable, live] to "production".
```

### List tags
```bash
envault tag production --list
# Tags for "production": stable, live
```

### Remove a tag
```bash
envault tag production --remove live
# Removed tag "live" from "production".
```

## Notes

- Tags are stored in the vault file alongside environment metadata.
- Duplicate tags are silently ignored when adding.
- Removing a tag that does not exist will print a warning but not error.
