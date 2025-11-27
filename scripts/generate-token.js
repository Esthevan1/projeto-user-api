const jwt = require('jsonwebtoken');

const SECRET = 'SUPER_SECRET_LOCAL_KEY';

const role = process.argv[2] || 'admin';
const sub = process.argv[3] || 'test-user';

const scope = role === 'admin' ? 'read:users write:users' : 'read:users';

const token = jwt.sign({ sub, role, roles: [role], scope, iss: 'http://localhost:3001/', aud: 'projeto-user-api' }, SECRET, { expiresIn: '1h' });

console.log(token);
