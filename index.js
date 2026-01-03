const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

/**
 * NEW ORDER-BASED CHECK (orderId)
 */
app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({ error: 'packageName and orderId are required' });
    }

    const client = await auth.getClient();
    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth: client
    });

    const result = await androidpublisher.orders.get({
      packageName,
      orderId
    });

    const order = result.data;

    res.json({
      orderId: order.orderId,
      purchaseToken: order.lineItems?.[0]?.purchaseToken || null,
      productId: order.lineItems?.[0]?.productId || null,
      purchaseTimeMillis: order.lineItems?.[0]?.purchaseTimeMillis || null,
      state: order.lineItems?.[0]?.state || null,
      price: order.lineItems?.[0]?.price?.amountMicros || null,
      currency: order.lineItems?.[0]?.price?.currencyCode || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('NEW Order API running on port 3000');
});
