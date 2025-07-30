const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

app.post('/check', async (req, res) => {
  try {
    const { packageName, productId, purchaseToken } = req.body;
    const client = await auth.getClient();
    const androidpublisher = google.androidpublisher({ version: 'v3', auth: client });

    const result = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken
    });

    res.json({   purchaseState: result.data.purchaseState,   consumptionState: result.data.consumptionState,   acknowledgementState: result.data.acknowledgementState,   orderId: result.data.orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("API is running on port 3000"));
