const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Atlas Connection...');
console.log('Connection String (masked):', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':***@'));

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 2000
    });

    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗃️  Database: ${conn.connection.name}`);
    console.log(`🔢 Ready State: ${conn.connection.readyState}`);

    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error Code:', error.code);
    console.error('Error Name:', error.codeName);
    console.error('Error Message:', error.message);
    
    if (error.code === 8000) {
      console.log('\n🛠️  Authentication Error Solutions:');
      console.log('1. Verify username and password in MongoDB Atlas');
      console.log('2. Check if user has proper database permissions');
      console.log('3. Ensure the user is created in the correct project');
      console.log('4. Check if IP address is whitelisted (0.0.0.0/0 for all IPs)');
      console.log('5. Verify the cluster name and connection string');
    }
    
    process.exit(1);
  }
}

testConnection();