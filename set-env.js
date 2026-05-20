const fs = require('fs');
const targetPath = './src/environments/environment.ts';

const envConfigFile = `export const environment = {
  production: true,
  nasaApiKey: '${process.env.nasaApiKey || 'DEMO_KEY'}',
  supabaseUrl: '${process.env.supabaseUrl || ''}',
  supabaseKey: '${process.env.supabaseKey || ''}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Output generated to ${targetPath}`);