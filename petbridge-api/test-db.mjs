import 'dotenv/config';
import sql from './src/db.js';
async function test() {
  console.log("Connecting to Supabase...");
  try {
    const res = await sql`SELECT 1 as result`;
    console.log('Connection successful!', res);
  } catch (err) {
    console.error('Connection failed!', err);
  } finally {
    process.exit();
  }
}
test();
