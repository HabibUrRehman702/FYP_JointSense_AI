const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Debugging MongoDB Atlas Connection...\n');

// Test different connection strings
const connectionStrings = [
  // Original with database name
  `mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/Joint_Sense_AI?retryWrites=true&w=majority`,
  
  // URL encoded password
  `mongodb+srv://jointsense-ai-db:${encodeURIComponent('habibkhantrajah123')}@cluster0.toc5fdh.mongodb.net/Joint_Sense_AI?retryWrites=true&w=majority`,
  
  // Without database name
  `mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/?retryWrites=true&w=majority`,
  
  // Different options
  `mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/Joint_Sense_AI?retryWrites=true&w=majority&authSource=admin`,
];

async function testConnection(uri, index) {
  console.log(`\n🧪 Test ${index + 1}: Testing connection...`);
  console.log(`URI: ${uri.replace(/habibkhantrajah123/g, '****')}`);
  
  try {
    const connection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connection successful!');
    await connection.close();
    return true;
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    console.log(`   CodeName: ${error.codeName || 'N/A'}`);
    return false;
  }
}

async function runTests() {
  console.log('Environment variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      console.log('\n🎉 Found working connection string!');
      console.log('Update your .env file with this URI:');
      console.log(`MONGODB_URI=${connectionStrings[i]}`);
      break;
    }
  }
  
  console.log('\n📋 MongoDB Atlas Setup Checklist:');
  console.log('1. ✓ Go to MongoDB Atlas Dashboard');
  console.log('2. ✓ Database Access → Check user "jointsense-ai-db" exists');
  console.log('3. ✓ User should have "Read and write to any database" privileges');
  console.log('4. ✓ Network Access → Add 0.0.0.0/0 (Allow access from anywhere)');
  console.log('5. ✓ Clusters → Connect → Get latest connection string');
  console.log('6. ✓ Make sure cluster is not paused');
  
  console.log('\n🔧 If still failing, try:');
  console.log('   • Create a new database user with different username/password');
  console.log('   • Use "Database User" (not "Atlas User") for connection');
  console.log('   • Check cluster is M0+ (not M0 Sandbox limitations)');
  console.log('   • Verify cluster region and connection string');
  
  process.exit(0);
}

runTests().catch(console.error);