# `snapshot` Command

Manage point-in-time snapshots of your vault file. Snapshots allow you to save the current state of the vault and restore it later — useful before bulk changes or destructive operations.

## Subcommands

### `snapshot save [label]`

Save a snapshot of the current vault state.

```bash
envault snapshot save before-migration
```

- `label` _(optional)_: A human-readable label for the snapshot.
- `-f, --file <path>`: Path to the vault file (default: `.envault`).

### `snapshot list`

List all saved snapshots, ordered by newest first.

```bash
envault snapshot list
```

Output example:
```
abc123xyz  2024-06-01T12:00:00.000Z — before-migration
def456uvw  2024-05-28T09:30:00.000Z
```

### `snapshot restore <id>`

Restore the vault to a previously saved snapshot.

```bash
envault snapshot restore abc123xyz
```

- `id`: The snapshot ID to restore.
- `-f, --file <path>`: Path to the vault file (default: `.envault`).

> ⚠️ This will **overwrite** the current vault file. Consider saving a snapshot before restoring.

### `snapshot delete <id>`

Delete a snapshot by its ID.

```bash
envault snapshot delete abc123xyz
```

## Storage

Snapshots are stored as JSON files in the `.envault-snapshots/` directory. Add this directory to `.gitignore` if you do not want snapshots committed to version control.
