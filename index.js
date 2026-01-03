const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({ error: 'packageName and orderId required' });
    }

    // 🔑 Get OAuth access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // 📡 Orders REST API call
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/orders/${orderId}`;

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

    const lineItem = data.lineItems?.[0] || {};

    res.json({
      orderId: data.orderId,
      productId: lineItem.productId || null,
      purchaseToken: lineItem.purchaseToken || null,
      purchaseTimeMillis: lineItem.purchaseTimeMillis || null,
      state: lineItem.state || null,
      priceMicros: lineItem.price?.amountMicros || null,
      currency: lineItem.price?.currencyCode || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Order API running'));
