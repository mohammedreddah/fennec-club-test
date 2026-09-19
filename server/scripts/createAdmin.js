// Creates the very first admin account, directly against the database.
// Usage:
//   npm run create-admin -- --email=admin@fennecclub.com --password=SomeStrongPass123 --name="Head Admin"
//
// Run this from the server/ directory, with server/.env already configured
// (it uses the same DATABASE_URL as the running API).
import dotenv from 'dotenv';
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

dotenv.config();

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { email: rawEmail, password, name } = parseArgs();
  const email = rawEmail ? rawEmail.trim().toLowerCase() : rawEmail;

  if (!email || !password || !name) {
    console.error(
      'Usage: npm run create-admin -- --email=admin@example.com --password=YourStrongPassword --name="Head Admin"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('select id from profiles where email = $1', [email]);
    if (existing.rows.length > 0) {
      console.error(`An account with email "${email}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);

    await client.query('BEGIN');
    const { rows } = await client.query(
      `insert into profiles (email, password_hash, full_name, role, is_active)
       values ($1, $2, $3, 'admin', true) returning id`,
      [email, passwordHash, name]
    );
    const id = rows[0].id;
    await client.query('insert into admins (id) values ($1)', [id]);
    await client.query('COMMIT');

    console.log(`Admin account created successfully.`);
    console.log(`  Email: ${email}`);
    console.log(`  You can now log in with this email and the password you provided.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
