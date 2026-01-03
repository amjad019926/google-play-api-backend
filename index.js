const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

app.post('/order', async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    const client = await auth.getClient();
    const androidpublisher = google.androidpublisher({ version: 'v3', auth: client });

    const result = await androidpublisher.orders.get({
      packageName,
      orderId
    });

    res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('API is running on port 3000'));
