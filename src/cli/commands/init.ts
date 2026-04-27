import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Command } from 'commander';
import { createVault } from '../../vault';

const DEFAULT_VAULT_FILE = '.envault';

export function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function initVault(
  vaultPath: string,
  environments: string[],
  force: boolean
): Promise<void> {
  const resolvedPath = path.resolve(vaultPath);

  if (fs.existsSync(resolvedPath) && !force) {
    console.error(
      `Vault file already exists at ${resolvedPath}. Use --force to overwrite.`
    );
    process.exit(1);
  }

  const vault = createVault(environments);

  fs.writeFileSync(resolvedPath, JSON.stringify(vault, null, 2), 'utf-8');
  console.log(`Vault initialized at ${resolvedPath}`);
  console.log(`Environments: ${environments.join(', ')}`);
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a new envault vault file')
    .option('-o, --output <path>', 'Path for the vault file', DEFAULT_VAULT_FILE)
    .option(
      '-e, --environments <envs>',
      'Comma-separated list of environments',
      'development,staging,production'
    )
    .option('-f, --force', 'Overwrite existing vault file', false)
    .action(async (options) => {
      const environments = options.environments
        .split(',')
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0);

      if (environments.length === 0) {
        console.error('At least one environment must be specified.');
        process.exit(1);
      }

      await initVault(options.output, environments, options.force);
    });
}
