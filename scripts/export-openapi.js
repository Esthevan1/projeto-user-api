const fs = require('fs');
const path = require('path');

function loadSwaggerOptions() {
  // Prefer built JS in dist if available
  const distPath = path.join(__dirname, '..', 'dist', 'swagger.js');
  if (fs.existsSync(distPath)) {
    const mod = require(distPath);
    return mod && (mod.default || mod);
  }

  // Fallback: require TypeScript source via ts-node/register if available
  try {
    require('ts-node/register');
    const mod = require(path.join(__dirname, '..', 'src', 'swagger'));
    return mod && (mod.default || mod);
  } catch (err) {
    console.error('Could not load swagger options from dist or src. Error:', err.message || err);
    process.exit(1);
  }
}

const swaggerOptions = loadSwaggerOptions();
const swaggerJSDoc = require('swagger-jsdoc');

const spec = swaggerJSDoc(swaggerOptions);
const out = path.join(process.cwd(), 'openapi.json');
fs.writeFileSync(out, JSON.stringify(spec, null, 2), 'utf8');
console.log('Wrote OpenAPI spec to', out);
