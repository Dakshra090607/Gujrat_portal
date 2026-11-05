import '../src/config/env.js';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomUUID } from 'node:crypto';
import { connectDatabase, disconnectDatabase, db, withTransaction } from '../src/config/database.js';

async function main() {
  if (!stdin.isTTY) throw new Error('Run `npm run admin:create` in an interactive trusted terminal.');
  await connectDatabase();
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const email = (await prompt.question('Existing Neon Auth account email: ')).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    const result = await db.query('SELECT id, name, email, role, is_active FROM app_users WHERE lower(email) = $1', [email]);
    if (!result.rowCount) throw new Error('No BuildRule profile exists for that email. Register and sign in through the standard page first, then run this command.');
    const user = result.rows[0];
    if (!user.is_active) throw new Error('Disabled accounts cannot be promoted.');
    if (user.role === 'ADMIN') throw new Error('This account is already an administrator.');
    stdout.write(`\nPromote ${user.name} <${user.email}> from ${user.role} to ADMIN?\n`);
    if ((await prompt.question('Type PROMOTE to confirm: ')).trim() !== 'PROMOTE') throw new Error('Administrator provisioning cancelled.');
    await withTransaction(async (client) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext('buildrule-admin-account-changes'))", [], client);
      const locked = await db.query('SELECT id, role, is_active FROM app_users WHERE id = $1 FOR UPDATE', [user.id], client);
      if (!locked.rowCount || !locked.rows[0].is_active) throw new Error('The account is unavailable.');
      if (locked.rows[0].role === 'ADMIN') throw new Error('This account is already an administrator.');
      const updated = await db.query("UPDATE app_users SET role = 'ADMIN', updated_at = now() WHERE id = $1 RETURNING id", [user.id], client);
      await db.query(`INSERT INTO role_change_audit (id, actor_user_id, actor_label, target_user_id, action, old_value, new_value, note)
        VALUES ($1, NULL, 'trusted-cli', $2, 'ADMIN_PROVISIONED', $3, 'ADMIN', 'Initial administrator grant through the trusted CLI.')`, [randomUUID(), updated.rows[0].id, locked.rows[0].role], client);
    });
    console.log('Administrator role granted and recorded in the append-only role audit. The account password and session remain managed by Neon Auth.');
  } finally {
    prompt.close();
  }
}

try {
  await main();
} catch (error) {
  console.error(`Administrator provisioning failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
