const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

/**
 * Google Auth (Service Account)
 */
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

/**
 * RAW ORDER DATA ENDPOINT
 */
app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({ error: 'packageName and orderId are required' });
    }

    // Get OAuth token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Call Google Play Orders REST API
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/orders/${orderId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.token}`
      }
    });

    const data = await response.json();

    // Return raw data exactly as received
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Port binding for Render
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
