import { Command } from 'commander';
import * as readline from 'readline';
import { readVaultFile } from '../../vault/vault';
import { decrypt, deserializePayload } from '../../crypto/encryption';
import { lintEnvData, formatLintResults } from '../../vault/lint';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerLintCommand(program: Command): void {
  program
    .command('lint [environments...]')
    .description('Lint env entries in one or more environments for common issues')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .option('-p, --password <password>', 'Vault password')
    .option('--fail-on-warnings', 'Exit with code 1 if any warnings are found')
    .action(async (environments: string[], options) => {
      try {
        const vault = await readVaultFile(options.file);
        const password = options.password ?? (await promptPassword('Enter vault password: '));

        const envNames: string[] =
          environments.length > 0
            ? environments
            : Object.keys(vault.environments ?? {});

        if (envNames.length === 0) {
          console.log('No environments found in vault.');
          return;
        }

        const results = await Promise.all(
          envNames.map(async (env) => {
            const entry = vault.environments?.[env];
            if (!entry) {
              console.warn(`Warning: environment "${env}" not found, skipping.`);
              return null;
            }
            const payload = deserializePayload(entry.data);
            const decrypted = await decrypt(payload, password);
            return lintEnvData(env, decrypted);
          })
        );

        const validResults = results.filter(Boolean) as Awaited<ReturnType<typeof lintEnvData>>[];
        console.log(formatLintResults(validResults));

        if (options.failOnWarnings && validResults.some((r) => r.warnings.length > 0)) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error('Error running lint:', err.message);
        process.exit(1);
      }
    });
}
