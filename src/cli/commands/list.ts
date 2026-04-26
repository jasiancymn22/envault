import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { readVaultFile, listEnvironments } from '../../vault';

/**
 * Default vault file path (can be overridden via options)
 */
const DEFAULT_VAULT_PATH = '.envault';

/**
 * Formats environment entries for display in the terminal.
 * Shows key names without revealing values.
 */
function formatEnvironmentKeys(keys: string[]): string {
  if (keys.length === 0) {
    return '  (no entries)';
  }
  return keys.map((key) => `  - ${key}`).join('\n');
}

/**
 * Registers the `list` command on the given Commander program.
 *
 * Usage:
 *   envault list                  # lists all environments
 *   envault list --env production  # lists keys in a specific environment
 *   envault list --vault ./custom.envault
 */
export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List environments or keys stored in the vault')
    .option('-e, --env <environment>', 'Show keys for a specific environment')
    .option('-v, --vault <path>', 'Path to vault file', DEFAULT_VAULT_PATH)
    .action(async (options: { env?: string; vault: string }) => {
      const vaultPath = path.resolve(options.vault);

      // Check vault file exists
      if (!fs.existsSync(vaultPath)) {
        console.error(
          `Error: Vault file not found at "${vaultPath}". Run "envault set" to create one.`
        );
        process.exit(1);
      }

      try {
        const vault = readVaultFile(vaultPath);
        const environments = listEnvironments(vault);

        if (environments.length === 0) {
          console.log('No environments found in vault.');
          return;
        }

        // Show keys for a specific environment (encrypted, so only key names are shown)
        if (options.env) {
          const envName = options.env;

          if (!environments.includes(envName)) {
            console.error(
              `Error: Environment "${envName}" not found in vault.\n` +
                `Available environments: ${environments.join(', ')}`
            );
            process.exit(1);
          }

          const entry = vault.environments[envName];
          const keyCount = entry?.keyCount ?? 0;

          console.log(`Environment: ${envName}`);
          console.log(`  Keys stored : ${keyCount}`);
          console.log(`  Last updated: ${entry?.updatedAt ?? 'unknown'}`);
          console.log(
            '\n  Note: Key names are not stored in plaintext. Use "envault get" to decrypt and view keys.'
          );
          return;
        }

        // List all environments with metadata
        console.log(`Vault: ${vaultPath}`);
        console.log(`Environments (${environments.length}):`);

        for (const envName of environments) {
          const entry = vault.environments[envName];
          const keyCount = entry?.keyCount ?? 0;
          const updatedAt = entry?.updatedAt ?? 'unknown';
          console.log(`  ${envName}  (${keyCount} key${keyCount !== 1 ? 's' : ''}, updated: ${updatedAt})`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error reading vault: ${message}`);
        process.exit(1);
      }
    });
}
