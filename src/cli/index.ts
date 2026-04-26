import { Command } from 'commander';
import { setCommand } from './commands/set';
import { getCommand } from './commands/get';
import { listEnvironments } from '../vault';
import { readVaultFile } from '../vault';

const program = new Command();

program
  .name('envault')
  .description('Manage and encrypt .env files across multiple environments')
  .version('0.1.0');

program.addCommand(setCommand);
program.addCommand(getCommand);

program
  .command('list')
  .description('List all environments stored in the vault')
  .option('-f, --file <path>', 'Path to vault file', '.envault')
  .action((options: { file: string }) => {
    const vault = readVaultFile(options.file);
    if (!vault) {
      console.log('No vault file found.');
      return;
    }
    const envs = listEnvironments(vault);
    if (envs.length === 0) {
      console.log('No environments found in vault.');
    } else {
      console.log('Environments:');
      envs.forEach((env) => {
        const updatedAt = vault.environments[env]?.updatedAt ?? 'unknown';
        console.log(`  • ${env}  (updated: ${updatedAt})`);
      });
    }
  });

program
  .command('remove')
  .description('Remove an environment from the vault')
  .argument('<environment>', 'Environment to remove')
  .option('-f, --file <path>', 'Path to vault file', '.envault')
  .action((environment: string, options: { file: string }) => {
    const { removeEntry, writeVaultFile } = require('../vault');
    const vault = readVaultFile(options.file);
    if (!vault) {
      console.error('Error: No vault file found.');
      process.exit(1);
    }
    const updated = removeEntry(vault, environment);
    writeVaultFile(options.file, updated);
    console.log(`✓ Removed environment [${environment}] from vault.`);
  });

export { program };
