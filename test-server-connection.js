const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing server-style connection...');

async function testServerConnection() {
  try {
    // This is the EXACT same code that worked in troubleshoot-atlas.js
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ SUCCESS with createConnection!');
    console.log(`Host: ${connection.host || 'undefined'}`);
    console.log(`Database: ${connection.name || 'undefined'}`);
    await connection.close();
    
    // Now test with mongoose.connect (what the server uses)
    console.log('\n🔄 Testing with mongoose.connect...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ SUCCESS with mongoose.connect!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    await mongoose.disconnect();
    console.log('✅ Both methods work!');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('Code:', error.code);
    console.error('CodeName:', error.codeName);
  }
  
  process.exit(0);
}

testServerConnection();