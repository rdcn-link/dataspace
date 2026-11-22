import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
// Overlay without deleting user files. Static assets preserve original paths.
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
console.log('Built dist; deploy with the page routes and API proxy in nginx.conf.example');
