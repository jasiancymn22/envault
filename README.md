# envault

> A CLI tool to manage and encrypt `.env` files across multiple environments with team sharing support.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize envault in your project, then push and pull encrypted environment files with your team.

```bash
# Initialize a new vault in your project
envault init

# Encrypt and push your .env file to the vault
envault push --env production

# Pull and decrypt a shared .env file
envault pull --env production

# List all stored environments
envault list
```

Secrets are encrypted using AES-256 before being stored or shared. Each team member authenticates with a shared vault key configured during `init`.

```bash
# Rotate the encryption key for an environment
envault rotate --env staging
```

---

## Configuration

A `.envault.json` config file is created at the project root on init:

```json
{
  "vault": "my-project",
  "environments": ["development", "staging", "production"]
}
```

---

## Requirements

- Node.js >= 16
- npm >= 8

---

## License

[MIT](./LICENSE)