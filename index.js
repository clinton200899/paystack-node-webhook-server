const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// MySQL database connection using environment variables
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Webhook endpoint
app.post('/', (req, res) => {
  const event = req.body;

  if (event && event.event === 'charge.success') {
    const ref = event.data.reference;

    // Check if the order with the payment reference exists
    conn.query('SELECT * FROM orders WHERE payment_ref = ?', [ref], (err, results) => {
      if (err) return res.status(500).send('Database error');

      if (results.length > 0 && results[0].status !== 'Paid') {
        // Update the order status to 'Paid'
        conn.query('UPDATE orders SET status = ? WHERE payment_ref = ?', ['Paid', ref], (err2) => {
          if (err2) return res.status(500).send('Update failed');
          return res.status(200).send('Order updated successfully');
        });
      } else {
        return res.status(200).send('Order not found or already paid');
      }
    });
  } else {
    res.status(400).send('Invalid webhook event');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('🚀 Webhook server is running on port 3000');
});
