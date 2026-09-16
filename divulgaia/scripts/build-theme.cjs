// Vanilla CSS browsers ignore @theme. Generate the runtime variables from the
// official source, without changing any token or requiring a CSS framework.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'theme.css'), 'utf8');
const output = '/* Generated from theme.css. Do not edit by hand. */\n' + source.replace('@theme', ':root');
const target = path.join(root, 'theme.tokens.css');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output.replace(/\r\n/g, '\n')) {
    throw new Error('Run node scripts/build-theme.cjs to synchronize theme.tokens.css');
  }
  console.log('Theme tokens synchronized.');
} else fs.writeFileSync(target, output);
