const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres',
    port: 54322,
});

async function run() {
    await client.connect();
    try {
        const res = await client.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'vehicules' 
              AND column_name = 'annee'
          ) THEN
              ALTER TABLE vehicules ADD COLUMN annee INTEGER;
          END IF;
      END $$;
    `);
        console.log("Migration successful:", res);
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
