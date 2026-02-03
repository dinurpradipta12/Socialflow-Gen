import dotenv from 'dotenv';
dotenv.config();

import { initDb } from '../src/db';
import db from '../src/db';
import { encryptText } from '../src/crypto';

async function run() {
  await initDb();

  const appId = process.argv[2] || process.env.APP_ID;
  const apiKey = process.argv[3] || process.env.API_KEY;
  const webhookUrl = process.argv[4] || process.env.WEBHOOK_URL || null;
  const name = process.argv[5] || process.env.APP_NAME || null;

  if (!appId || !apiKey) {
    console.error('Usage: ts-node scripts/insert_api_key.ts <APP_ID> <API_KEY> [WEBHOOK_URL] [NAME]');
    process.exit(2);
  }

  const encrypted = encryptText(apiKey);

  const exists = await db('apps').where({ app_id: appId }).first();
  if (exists) {
    await db('apps').where({ app_id: appId }).update({ api_key_encrypted: encrypted, webhook_url: webhookUrl, name });
    console.log(`Updated app ${appId} with encrypted API key.`);
  } else {
    await db('apps').insert({ app_id: appId, api_key_encrypted: encrypted, webhook_url: webhookUrl, name });
    console.log(`Inserted app ${appId} with encrypted API key.`);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('insert_api_key error', err);
  process.exit(1);
});
