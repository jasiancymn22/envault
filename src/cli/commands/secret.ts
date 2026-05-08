import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile, writeVaultFile } from '../../vault';
import { encryptSecret, decryptSecret, updateSecretMetadata, filterSecretsByTag } from '../../vault/secret';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerSecretCommand(program: Command): void {
  const secret = program.command('secret').description('Manage individual secrets with metadata');

  secret
    .command('set <environment> <key> <value>')
    .description('Encrypt and store a secret with optional metadata')
    .option('-t, --tags <tags>', 'Comma-separated list of tags')
    .option('-d, --description <desc>', 'Description for the secret')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action(async (environment: string, key: string, value: string, opts) => {
      const password = await promptPassword('Password: ');
      const vault = readVaultFile(opts.file);
      const tags = opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : undefined;
      const entry = await encryptSecret(key, value, environment, password, {
        tags,
        description: opts.description,
      });
      if (!vault.secrets) vault.secrets = [];
      const idx = vault.secrets.findIndex(
        (s: any) => s.metadata.key === key && s.metadata.environment === environment
      );
      if (idx >= 0) vault.secrets[idx] = entry;
      else vault.secrets.push(entry);
      writeVaultFile(opts.file, vault);
      console.log(`Secret "${key}" stored for environment "${environment}".`);
    });

  secret
    .command('get <environment> <key>')
    .description('Decrypt and display a secret value')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action(async (environment: string, key: string, opts) => {
      const password = await promptPassword('Password: ');
      const vault = readVaultFile(opts.file);
      const entry = (vault.secrets || []).find(
        (s: any) => s.metadata.key === key && s.metadata.environment === environment
      );
      if (!entry) {
        console.error(`Secret "${key}" not found in environment "${environment}".`);
        process.exit(1);
      }
      const value = await decryptSecret(entry, password);
      console.log(value);
    });

  secret
    .command('tag <environment> <key> <tags>')
    .description('Update tags for a secret')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action(async (environment: string, key: string, tags: string, opts) => {
      const vault = readVaultFile(opts.file);
      const idx = (vault.secrets || []).findIndex(
        (s: any) => s.metadata.key === key && s.metadata.environment === environment
      );
      if (idx < 0) {
        console.error(`Secret "${key}" not found.`);
        process.exit(1);
      }
      vault.secrets[idx] = updateSecretMetadata(vault.secrets[idx], {
        tags: tags.split(',').map((t: string) => t.trim()),
      });
      writeVaultFile(opts.file, vault);
      console.log(`Tags updated for "${key}" in "${environment}".`);
    });

  secret
    .command('search <tag>')
    .description('List secrets matching a tag')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .action((tag: string, opts) => {
      const vault = readVaultFile(opts.file);
      const matches = filterSecretsByTag(vault.secrets || [], tag);
      if (matches.length === 0) {
        console.log(`No secrets found with tag "${tag}".`);
        return;
      }
      matches.forEach((e: any) => {
        console.log(`[${e.metadata.environment}] ${e.metadata.key}${e.metadata.description ? ' — ' + e.metadata.description : ''}`);
      });
    });
}
