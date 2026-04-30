import { Command } from 'commander';
import { readVaultFile } from '../../vault';
import { decrypt } from '../../crypto';
import { parseEnv } from '../../vault/envParser';
import * as readline from 'readline';

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

export interface VaultStats {
  totalEnvironments: number;
  totalKeys: number;
  keysPerEnvironment: Record<string, number>;
  uniqueKeys: string[];
  sharedKeys: string[];
  vaultFile: string;
}

export async function computeStats(vaultPath: string, password: string): Promise<VaultStats> {
  const vault = await readVaultFile(vaultPath);
  const environments = Object.keys(vault.environments || {});
  const keysPerEnvironment: Record<string, number> = {};
  const allKeySets: Record<string, Set<string>> = {};

  for (const env of environments) {
    const entry = vault.environments[env];
    const decrypted = await decrypt(entry.data, password);
    const parsed = parseEnv(decrypted);
    const keys = Object.keys(parsed);
    keysPerEnvironment[env] = keys.length;
    allKeySets[env] = new Set(keys);
  }

  const allKeys = new Set<string>();
  for (const s of Object.values(allKeySets)) s.forEach((k) => allKeys.add(k));

  const uniqueKeys: string[] = [];
  const sharedKeys: string[] = [];

  for (const key of allKeys) {
    const count = Object.values(allKeySets).filter((s) => s.has(key)).length;
    if (count === 1) uniqueKeys.push(key);
    else if (count === environments.length && environments.length > 1) sharedKeys.push(key);
  }

  return {
    totalEnvironments: environments.length,
    totalKeys: allKeys.size,
    keysPerEnvironment,
    uniqueKeys: uniqueKeys.sort(),
    sharedKeys: sharedKeys.sort(),
    vaultFile: vaultPath,
  };
}

export function registerStatsCommand(program: Command): void {
  program
    .command('stats')
    .description('Show statistics about the vault and its environments')
    .option('-f, --file <path>', 'vault file path', '.envault')
    .option('--json', 'output as JSON')
    .action(async (options) => {
      try {
        const password = await promptPassword('Enter vault password: ');
        const stats = await computeStats(options.file, password);
        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log(`\nVault: ${stats.vaultFile}`);
          console.log(`Environments : ${stats.totalEnvironments}`);
          console.log(`Unique key names : ${stats.totalKeys}`);
          console.log(`\nKeys per environment:`);
          for (const [env, count] of Object.entries(stats.keysPerEnvironment)) {
            console.log(`  ${env}: ${count} key(s)`);
          }
          if (stats.sharedKeys.length) {
            console.log(`\nShared across all environments (${stats.sharedKeys.length}): ${stats.sharedKeys.join(', ')}`);
          }
          if (stats.uniqueKeys.length) {
            console.log(`Unique to one environment (${stats.uniqueKeys.length}): ${stats.uniqueKeys.join(', ')}`);
          }
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
