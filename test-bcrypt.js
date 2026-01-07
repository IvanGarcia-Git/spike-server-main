const bcryptjs = require('bcryptjs');

// El hash que creamos
const storedHash = '$2a$10$lZqkSxMSu8StBbv5ghn4de2GZIcjQImWOZs4vL88ubMI/yRqqef7e';
const password = '123456';

async function test() {
  console.log('Testing bcrypt...');
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);

  // Test 1: Compare directly
  const match = await bcryptjs.compare(password, storedHash);
  console.log('\nDirect compare result:', match);

  // Test 2: Generate a new hash and compare
  const newHash = await bcryptjs.hash(password, 10);
  console.log('\nNewly generated hash:', newHash);

  const newMatch = await bcryptjs.compare(password, newHash);
  console.log('New hash compare result:', newMatch);

  // Test 3: Verify the stored hash format
  console.log('\nHash format analysis:');
  console.log('- Starts with $2a$:', storedHash.startsWith('$2a$'));
  console.log('- Length:', storedHash.length);
  console.log('- Expected length: 60');
}

test().catch(console.error);
