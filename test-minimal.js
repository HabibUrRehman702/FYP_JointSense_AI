const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing minimal MongoDB connection...');

async function testMinimalConnection() {
  try {
    console.log('Environment loaded:');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    const uri = process.env.MONGODB_URI;
    console.log('Using URI:', uri.replace(/habibkhantrajah123/g, '****'));
    
    // Connect with minimal options (same as debug script that worked)
    await mongoose.connect(uri);
    
    console.log('✅ SUCCESS: MongoDB connected!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    console.log('Ready state:', mongoose.connection.readyState);
    
    // Test a simple operation
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ message: 'Connection test', timestamp: new Date() });
    console.log('✅ SUCCESS: Test document inserted!');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('Code:', error.code);
    console.error('CodeName:', error.codeName);
  }
  
  process.exit(0);
}

testMinimalConnection();