import knexPkg from 'knex';
import path from 'path';

const knex = knexPkg;

const DB_CLIENT = process.env.DB_CLIENT || 'sqlite';

const db = knex({
  client: DB_CLIENT === 'pg' ? 'pg' : 'sqlite3',
  connection: DB_CLIENT === 'pg' ? process.env.DATABASE_URL : { filename: path.resolve(__dirname, '../../data.sqlite') },
  useNullAsDefault: true,
});

export async function initDb() {
  // apps
  const hasApps = await db.schema.hasTable('apps');
  if (!hasApps) {
    await db.schema.createTable('apps', (t) => {
      t.increments('id').primary();
      t.string('app_id').unique().notNullable();
      t.string('name');
      t.text('webhook_url');
      t.text('api_key_encrypted');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasMembers = await db.schema.hasTable('members');
  if (!hasMembers) {
    await db.schema.createTable('members', (t) => {
      t.string('id').primary();
      t.string('external_id').notNullable();
      t.string('app_id').notNullable();
      t.string('email');
      t.string('status').notNullable().defaultTo('pending');
      t.text('metadata');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('approved_by');
      t.timestamp('approved_at');
    });
  }

  const hasEvents = await db.schema.hasTable('events');
  if (!hasEvents) {
    await db.schema.createTable('events', (t) => {
      t.increments('id').primary();
      t.string('app_id').notNullable();
      t.string('type').notNullable();
      t.text('payload');
      t.timestamp('received_at').defaultTo(db.fn.now());
    });
  }

  const hasLogs = await db.schema.hasTable('webhook_logs');
  if (!hasLogs) {
    await db.schema.createTable('webhook_logs', (t) => {
      t.increments('id').primary();
      t.integer('event_id');
      t.string('app_id');
      t.text('payload');
      t.integer('status_code');
      t.text('response');
      t.timestamp('attempted_at').defaultTo(db.fn.now());
      t.boolean('success').defaultTo(false);
    });
  }
}

export default db;
