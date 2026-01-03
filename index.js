const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

/**
 * Google Auth
 */
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

/**
 * ORDER LOOKUP BY ORDER ID (NEW SYSTEM)
 */
app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({
        error: 'packageName and orderId are required'
      });
    }

    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Orders REST API (SDK does NOT support this yet)
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/orders/${orderId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const item = data.lineItems && data.lineItems[0] ? data.lineItems[0] : {};

    res.json({
      orderId: data.orderId,
      productId: item.productId || null,
      purchaseToken: item.purchaseToken || null,
      purchaseTimeMillis: item.purchaseTimeMillis || null,
      state: item.state || null,
      priceMicros: item.price?.amountMicros || null,
      currency: item.price?.currencyCode || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * REQUIRED FOR RENDER
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
