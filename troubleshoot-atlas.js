const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 MongoDB Atlas Connection Troubleshooter\n');

// Test different scenarios
const tests = [
  {
    name: 'Test 1: Current ENV connection string',
    uri: process.env.MONGODB_URI
  },
  {
    name: 'Test 2: Without database name',
    uri: 'mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
  },
  {
    name: 'Test 3: With admin authSource',
    uri: 'mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/Joint_Sense_AI?retryWrites=true&w=majority&authSource=admin&appName=Cluster0'
  },
  {
    name: 'Test 4: URL encoded password',
    uri: `mongodb+srv://jointsense-ai-db:${encodeURIComponent('habibkhantrajah123')}@cluster0.toc5fdh.mongodb.net/Joint_Sense_AI?retryWrites=true&w=majority&appName=Cluster0`
  },
  {
    name: 'Test 5: Alternative common database name',
    uri: 'mongodb+srv://jointsense-ai-db:habibkhantrajah123@cluster0.toc5fdh.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0'
  }
];

async function testConnection(test) {
  console.log(`\n${test.name}`);
  console.log(`URI: ${test.uri.replace(/habibkhantrajah123/g, '****')}`);
  
  try {
    const connection = await mongoose.createConnection(test.uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ SUCCESS: Connection established!');
    console.log(`   Host: ${connection.host}`);
    console.log(`   Database: ${connection.name}`);
    
    await connection.close();
    return test.uri;
  } catch (error) {
    console.log('❌ FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    console.log(`   CodeName: ${error.codeName || 'N/A'}`);
    
    // Provide specific guidance based on error
    if (error.codeName === 'AtlasError' && error.code === 8000) {
      console.log('   🔧 This is an authentication error - check MongoDB Atlas user credentials');
    }
    return null;
  }
}

async function runAllTests() {
  console.log('📋 Current Environment:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  
  let workingUri = null;
  
  for (const test of tests) {
    workingUri = await testConnection(test);
    if (workingUri) {
      console.log('\n🎉 FOUND WORKING CONNECTION!');
      console.log('Update your .env file with:');
      console.log(`MONGODB_URI=${workingUri}`);
      break;
    }
  }
  
  if (!workingUri) {
    console.log('\n❌ All connection attempts failed.');
    console.log('\n🛠️  MongoDB Atlas Checklist:');
    console.log('1. Go to MongoDB Atlas Dashboard → Your Project');
    console.log('2. Database Access → Check if user "jointsense-ai-db" exists');
    console.log('3. If user exists, try DELETING and RECREATING it:');
    console.log('   - Username: jointsense-ai-db');
    console.log('   - Password: habibkhantrajah123');
    console.log('   - Role: "Read and write to any database"');
    console.log('4. Network Access → Add IP 0.0.0.0/0 (allow all)');
    console.log('5. Database → Clusters → Make sure cluster is NOT paused');
    console.log('6. Try creating a NEW user with different credentials:');
    console.log('   - Username: joint-sense-admin');
    console.log('   - Password: NewSecurePass123!');
    console.log('\n🔄 Alternative: Get a fresh connection string from Atlas:');
    console.log('   Database → Clusters → Connect → Connect your application');
  }
  
  process.exit(0);
}

runAllTests().catch(console.error);