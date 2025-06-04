const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

require('dotenv').config();

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Missing token');
  jwt.verify(
    token,
    getKey,
    {
      audience: `api://${process.env.AZURE_BACKEND_CLIENT_ID}`,
      issuer: `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`
    },
    (err, decoded) => {
      if (err) return res.status(401).send('Invalid token');
      req.user = decoded;
      next();
    }
  );
};