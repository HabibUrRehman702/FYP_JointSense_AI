/**
 * IP Address Utility Functions
 * Normalizes IPv6 addresses to IPv4 format for consistent logging
 */

/**
 * Normalizes an IP address from IPv6 to IPv4 format when possible
 * @param {string} ip - The IP address to normalize
 * @returns {string} - Normalized IPv4 address or cleaned IPv6 address
 */
const normalizeIP = (ip) => {
  if (!ip || typeof ip !== 'string') {
    return '127.0.0.1'; // Default fallback
  }

  // Remove any whitespace
  ip = ip.trim();

  // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7); // Remove '::ffff:' prefix
  }

  // Handle IPv6 loopback (::1)
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // Handle IPv4 addresses (already normalized)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip;
  }

  // Handle other IPv6 addresses - keep as is but clean up
  if (ip.includes(':')) {
    // For pure IPv6 addresses, we'll keep them as is
    // but you could implement more specific handling here
    return ip;
  }

  // Fallback for any other format
  return ip || '127.0.0.1';
};

/**
 * Gets the normalized client IP from Express request object
 * @param {Object} req - Express request object
 * @returns {string} - Normalized IP address
 */
const getClientIP = (req) => {
  // Check various headers that might contain the real IP
  let ip = req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.headers['x-client-ip'] ||
           '127.0.0.1';

  return normalizeIP(ip);
};

module.exports = {
  normalizeIP,
  getClientIP
};