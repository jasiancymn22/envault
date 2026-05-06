import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import {
  extractTemplate,
  generateFromTemplate,
  validateAgainstTemplate,
  serializeTemplate,
  deserializeTemplate,
} from '../../vault/template';
import { readVaultFile } from '../../vault/vault';
import { decrypt } from '../../crypto';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerTemplateCommand(program: Command): void {
  const template = program
    .command('template')
    .description('Manage environment templates for onboarding and validation');

  template
    .command('extract <environment>')
    .description('Extract a template from an existing environment')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .option('-o, --output <path>', 'Output template file', '.envault.template')
    .action(async (environment: string, options: { file: string; output: string }) => {
      try {
        const password = await promptPassword('Password: ');
        const vault = readVaultFile(options.file);
        const env = vault.environments[environment];
        if (!env) {
          console.error(`Environment "${environment}" not found.`);
          process.exit(1);
        }
        const decrypted = await decrypt(env.data, password);
        const parsed: Record<string, string> = JSON.parse(decrypted);
        const tmpl = extractTemplate(parsed);
        fs.writeFileSync(options.output, serializeTemplate(tmpl), 'utf8');
        console.log(`Template extracted to ${options.output} (${tmpl.keys.length} keys).`);
      } catch (err) {
        console.error('Failed to extract template:', (err as Error).message);
        process.exit(1);
      }
    });

  template
    .command('validate <environment>')
    .description('Validate an environment against a template')
    .option('-f, --file <path>', 'Vault file path', '.envault')
    .option('-t, --template <path>', 'Template file', '.envault.template')
    .action(async (environment: string, options: { file: string; template: string }) => {
      try {
        const password = await promptPassword('Password: ');
        const vault = readVaultFile(options.file);
        const env = vault.environments[environment];
        if (!env) {
          console.error(`Environment "${environment}" not found.`);
          process.exit(1);
        }
        const templateRaw = fs.readFileSync(options.template, 'utf8');
        const tmpl = deserializeTemplate(templateRaw);
        const decrypted = await decrypt(env.data, password);
        const parsed: Record<string, string> = JSON.parse(decrypted);
        const errors = validateAgainstTemplate(tmpl, parsed);
        if (errors.length === 0) {
          console.log(`✔ Environment "${environment}" is valid against the template.`);
        } else {
          console.error(`✘ Validation failed for "${environment}":`);
          errors.forEach((e) => console.error(`  - ${e}`));
          process.exit(1);
        }
      } catch (err) {
        console.error('Validation error:', (err as Error).message);
        process.exit(1);
      }
    });
}
