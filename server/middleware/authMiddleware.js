const jwt = require('jwt-simple');
const JWT_SECRET = process.env.JWT_SECRET || 'gokashi_secret_key_123';

module.exports = (req, res, next) => {
  const token = req.headers['x-auth-token'];
  
  if (!token) {
    return res.status(401).json({ message: 'Access Denied. Pehle Login karein.' });
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    req.userId = decoded.userId; // Dukaandar ki ID request me attach ho gayi
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid ya Expired Token.' });
  }
};