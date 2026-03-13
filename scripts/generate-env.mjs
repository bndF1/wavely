/**
 * Generates Angular environment files from environment variables.
 *
 * Local dev:   node --env-file=.env scripts/generate-env.mjs
 * CI prod:     ENV_TARGET=prod node scripts/generate-env.mjs
 * CI staging:  ENV_TARGET=staging node scripts/generate-env.mjs
 *              (uses NG_APP_FIREBASE_*_STAGING secrets, falls back to NG_APP_FIREBASE_*)
 */

import { writeFileSync } from 'fs';

const target = process.env['ENV_TARGET'] ?? 'all';
const isStaging = target === 'staging';
const isProdOrStaging = target === 'prod' || isStaging;

const REQUIRED_KEYS = [
  'NG_APP_FIREBASE_API_KEY',
  'NG_APP_FIREBASE_AUTH_DOMAIN',
  'NG_APP_FIREBASE_PROJECT_ID',
  'NG_APP_FIREBASE_STORAGE_BUCKET',
  'NG_APP_FIREBASE_MESSAGING_SENDER_ID',
  'NG_APP_FIREBASE_APP_ID',
];

const get = (key) => {
  const stagingKey = `${key}_STAGING`;
  const val = isStaging
    ? (process.env[stagingKey] ?? process.env[key])
    : process.env[key];
  return val ?? '';
};

if (isProdOrStaging) {
  const missing = REQUIRED_KEYS.filter((key) => !get(key));
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${target}:`);
    missing.forEach((k) => console.error(`   - ${isStaging ? k + '_STAGING' : k}`));
    process.exit(1);
  }
}

const firebaseConfig = (productionFlag) => `export const environment = {
  production: ${productionFlag},
  firebase: {
    apiKey: '${get('NG_APP_FIREBASE_API_KEY')}',
    authDomain: '${get('NG_APP_FIREBASE_AUTH_DOMAIN')}',
    projectId: '${get('NG_APP_FIREBASE_PROJECT_ID')}',
    storageBucket: '${get('NG_APP_FIREBASE_STORAGE_BUCKET')}',
    messagingSenderId: '${get('NG_APP_FIREBASE_MESSAGING_SENDER_ID')}',
    appId: '${get('NG_APP_FIREBASE_APP_ID')}',
    measurementId: '${get('NG_APP_FIREBASE_MEASUREMENT_ID')}',
  },
};
`;

if (target === 'all' || target === 'dev') {
  writeFileSync('src/environments/environment.ts', firebaseConfig(false));
  console.log('✅ src/environments/environment.ts generated (dev)');
}

if (target === 'all' || target === 'prod') {
  writeFileSync('src/environments/environment.prod.ts', firebaseConfig(true));
  console.log('✅ src/environments/environment.prod.ts generated (prod)');
}

if (target === 'staging') {
  writeFileSync('src/environments/environment.staging.ts', firebaseConfig(false));
  console.log('✅ src/environments/environment.staging.ts generated (staging)');
}
