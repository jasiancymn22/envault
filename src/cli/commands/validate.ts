import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';
import { parseEnv } from '../../vault/envParser';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface ValidationResult {
  environment: string;
  valid: boolean;
  keyCount: number;
  emptyValues: string[];
  errors: string[];
}

export function validateEnvData(
  environment: string,
  data: Record<string, string>
): ValidationResult {
  const emptyValues: string[] = [];
  const errors: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (!key.match(/^[A-Z_][A-Z0-9_]*$/i)) {
      errors.push(`Invalid key name: "${key}"`);
    }
    if (value.trim() === '') {
      emptyValues.push(key);
    }
  }

  return {
    environment,
    valid: errors.length === 0,
    keyCount: Object.keys(data).length,
    emptyValues,
    errors,
  };
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate [environment]')
    .description('Validate the structure and contents of one or all environments in the vault')
    .option('-f, --vault-file <file>', 'Path to vault file', '.envault')
    .action(async (environment: string | undefined, options: { vaultFile: string }) => {
      const password = await promptPassword('Vault password: ');
      const vault = readVaultFile(options.vaultFile);
      const environments = environment ? [environment] : Object.keys(vault.environments);

      if (environments.length === 0) {
        console.log('No environments found in vault.');
        return;
      }

      let allValid = true;

      for (const env of environments) {
        if (!vault.environments[env]) {
          console.error(`Environment "${env}" not found.`);
          process.exitCode = 1;
          continue;
        }

        try {
          const decrypted = await decrypt(vault.environments[env], password);
          const data = parseEnv(decrypted);
          const result = validateEnvData(env, data);

          const status = result.valid ? '✔' : '✘';
          console.log(`\n[${status}] ${result.environment} (${result.keyCount} keys)`);

          if (result.emptyValues.length > 0) {
            console.log(`  ⚠ Empty values: ${result.emptyValues.join(', ')}`);
          }
          if (result.errors.length > 0) {
            allValid = false;
            result.errors.forEach((e) => console.log(`  ✘ ${e}`));
          }
        } catch {
          console.error(`  ✘ Failed to decrypt environment "${env}". Wrong password?`);
          allValid = false;
        }
      }

      if (!allValid) process.exitCode = 1;
    });
}
