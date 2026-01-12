import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://postgres:mysecretpassword@127.0.0.1:5432/erpgeneric",
});

async function test() {
  try {
    await client.connect();
    console.log("SUCCESS: Connected to PostgreSQL!");
    const res = await client.query("SELECT current_user, current_database()");
    console.log("DB Info:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("FAILURE: Could not connect!", err.message);
    process.exit(1);
  }
}

test();
