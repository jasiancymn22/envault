#!/usr/bin/env node
import { Command } from 'commander';
import { registerInitCommand } from './commands/init';
import { registerEnvCommand } from './commands/env';
import { registerListCommand } from './commands/list';
import { registerRemoveCommand } from './commands/remove';
import { registerExportCommand } from './commands/export';
import { registerImportCommand } from './commands/import';
import { registerRotateCommand } from './commands/rotate';
import { registerCopyCommand } from './commands/copy';
import { registerDiffCommand } from './commands/diff';

const program = new Command();

program
  .name('envault')
  .description('Manage and encrypt .env files across multiple environments')
  .version('1.0.0');

registerInitCommand(program);
registerEnvCommand(program);
registerListCommand(program);
registerRemoveCommand(program);
registerExportCommand(program);
registerImportCommand(program);
registerRotateCommand(program);
registerCopyCommand(program);
registerDiffCommand(program);

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
