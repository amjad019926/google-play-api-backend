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
 * ORDER LOOKUP BY ORDER ID (UNIVERSAL)
 * Works for:
 * - One-time products
 * - Subscriptions
 * - Legacy orders
 */
app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({
        error: 'packageName and orderId are required'
      });
    }

    // Get OAuth token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Orders REST endpoint
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

    // Safely extract first line item
    const item = data.lineItems?.[0] || {};

    // UNIVERSAL extraction (all order types)
    const productId =
      item.productId ||
      item.subscriptionDetails?.productId ||
      item.productDetails?.productId ||
      null;

    const purchaseToken =
      item.purchaseToken ||
      item.subscriptionDetails?.purchaseToken ||
      item.productDetails?.purchaseToken ||
      null;

    const purchaseTimeMillis =
      item.purchaseTimeMillis ||
      item.subscriptionDetails?.purchaseTimeMillis ||
      item.productDetails?.purchaseTimeMillis ||
      null;

    const state =
      item.state ||
      item.subscriptionDetails?.state ||
      item.productDetails?.state ||
      null;

    const price =
      item.price ||
      item.subscriptionDetails?.price ||
      item.productDetails?.price ||
      null;

    res.json({
      orderId: data.orderId,
      productId,
      purchaseToken,
      purchaseTimeMillis,
      state,
      priceMicros: price?.amountMicros || null,
      currency: price?.currencyCode || null
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
