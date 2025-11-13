#!/usr/bin/env node

/**
 * Script to update all req.ip usage to getClientIP(req) across route files
 */

const fs = require('fs');
const path = require('path');

const routeFiles = [
  'consultations.js',
  'diet.js',
  'forum.js',
  'medications.js',
  'messages.js',
  'notifications.js',
  'predictions.js',
  'recommendations.js',
  'users.js',
  'weight.js',
  'xrays.js'
];

const routesDir = path.join(__dirname, 'routes');

routeFiles.forEach(filename => {
  const filePath = path.join(routesDir, filename);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add the import if not already present
    if (!content.includes("require('../utils/ipUtils')")) {
      // Find the line with other requires and add our import
      const requirePattern = /const \{ .+ \} = require\('\.\.\/models'\);/;
      const match = content.match(requirePattern);
      
      if (match) {
        const insertAfter = match[0];
        content = content.replace(insertAfter, insertAfter + '\nconst { getClientIP } = require(\'../utils/ipUtils\');');
      }
    }
    
    // Replace all instances of req.ip in ipAddress fields
    content = content.replace(/ipAddress: req\.ip,/g, 'ipAddress: getClientIP(req),');
    
    // Write back the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
  } else {
    console.log(`File not found: ${filename}`);
  }
});

console.log('IP normalization update completed for all route files!');