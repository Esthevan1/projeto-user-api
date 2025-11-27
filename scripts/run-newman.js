const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const collection = path.join(__dirname, '..', 'postman', 'Projeto-User-API.postman_collection.json');
const environment = path.join(__dirname, '..', 'postman', 'Projeto-User-API.postman_environment.json');
const reportsDir = path.join(__dirname, '..', 'reports');

if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const args = ['newman', 'run', collection, '-e', environment, '--reporters', 'cli,junit,html', '--reporter-junit-export', path.join(reportsDir, 'newman-report.xml'), '--reporter-html-export', path.join(reportsDir, 'newman-report.html')];

// Append extra CLI args passed after `--` when invoked via npm
const extra = process.argv.slice(2);
if (extra && extra.length) args.push(...extra);

console.log('Running:', 'npx', args.join(' '));

const proc = spawn('npx', args, { stdio: 'inherit', shell: true });

proc.on('close', (code) => {
  if (code === 0) {
    console.log('Newman finished successfully. Reports in ./reports');
  } else {
    console.error('Newman exited with code', code);
  }
  process.exit(code);
});
