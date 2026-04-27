import { Command } from 'commander';
import { readVaultFile, writeVaultFile, addEnvironment, removeEnvironment, listEnvironments } from '../../vault';

export function registerEnvCommand(program: Command): void {
  const envCmd = program
    .command('env')
    .description('Manage environments within the vault');

  envCmd
    .command('add <name>')
    .description('Add a new environment to the vault')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .action((name: string, options) => {
      try {
        const vault = readVaultFile(options.vault);
        addEnvironment(vault, name);
        writeVaultFile(options.vault, vault);
        console.log(`Environment '${name}' added successfully.`);
      } catch (err: unknown) {
        console.error(
          `Error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        process.exit(1);
      }
    });

  envCmd
    .command('remove <name>')
    .description('Remove an environment from the vault')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .action((name: string, options) => {
      try {
        const vault = readVaultFile(options.vault);
        removeEnvironment(vault, name);
        writeVaultFile(options.vault, vault);
        console.log(`Environment '${name}' removed successfully.`);
      } catch (err: unknown) {
        console.error(
          `Error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        process.exit(1);
      }
    });

  envCmd
    .command('list')
    .description('List all environments in the vault')
    .option('-v, --vault <path>', 'Path to vault file', '.envault')
    .action((options) => {
      try {
        const vault = readVaultFile(options.vault);
        const envs = listEnvironments(vault);
        if (envs.length === 0) {
          console.log('No environments found in vault.');
        } else {
          console.log('Environments:');
          envs.forEach((e) => console.log(`  - ${e}`));
        }
      } catch (err: unknown) {
        console.error(
          `Error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        process.exit(1);
      }
    });
}
