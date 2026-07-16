import { readFile } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const contract = JSON.parse(await readFile(new URL('governance/package-contract.json', rootUrl), 'utf8'));
const packageName = process.env.npm_package_name;
const privateWorking = contract?.publication?.privateWorking;

if (!packageName || !Array.isArray(privateWorking) || !privateWorking.includes(packageName)) {
  console.error('PUBLISH BLOCKED: private-package publish guard configuration is invalid.');
  process.exitCode = 1;
} else {
  console.error(`PUBLISH BLOCKED: ${packageName} is a private, nonpublishable working package.`);
  console.error('Use npm pack for controlled review artifacts; publish only packages allowed by governance/package-contract.json.');
  process.exitCode = 1;
}
