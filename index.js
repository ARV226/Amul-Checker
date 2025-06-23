const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cheerio = require('cheerio');

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// QR code login display
client.on('qr', qr => {
  console.log('📲 Scan this QR code to login:');
  qrcode.generate(qr, { small: true });
});

// WhatsApp numbers to notify
const toNumbers = [
  '918377884512@c.us',
  '919711720145@c.us',
  '918287154627@c.us'
];

// List of products to track
const products = [
  {
    name: "Amul Whey Protein Gift Pack (10 sachets)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-gift-pack-32-g-or-pack-of-10-sachets"
  },
  {
    name: "Amul Whey Protein (30 sachets)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-32-g-or-pack-of-30-sachets"
  },
  {
    name: "Amul Whey Protein (60 sachets)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-32-g-or-pack-of-60-sachets"
  },
  {
    name: "Amul Chocolate Whey Gift Pack (10 sachets)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-gift-pack-34-g-or-pack-of-10-sachets"
  },
  {
    name: "Amul Chocolate Whey (30 sachets)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-34-g-or-pack-of-30-sachets"
  },
  {
    name: "Amul Chocolate Whey (60 sachets)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-34-g-or-pack-of-60-sachets"
  }
];

// Function to send message to all numbers
function sendWhatsAppToAll(numbers, message) {
  numbers.forEach(number => {
    client.sendMessage(number, message)
      .then(() => console.log(`✅ Sent to ${number}`))
      .catch(err => console.error(`❌ Failed to send to ${number}:`, err));
  });
}

// Check product stock status
async function checkAllProductsStock() {
  let available = [];

  for (const product of products) {
    try {
      const res = await axios.get(product.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $ = cheerio.load(res.data);

      // If "Sold Out" div is NOT present → it's in stock
      const isSoldOut = $('.alert.alert-danger.mt-3').length > 0;

      if (!isSoldOut) {
        available.push(`✅ *${product.name}*\n${product.url}`);
        console.log(`🟢 ${product.name} is IN STOCK!`);
      } else {
        console.log(`❌ ${product.name} is SOLD OUT.`);
      }

    } catch (err) {
      console.error(`❌ Error checking ${product.name}:`, err.message);
    }
  }

  // Send alert if any product is in stock
  if (available.length > 0) {
    const msg = `🟢 *THE FOLLOWING PRODUCTS ARE NOW IN STOCK!*\n\n${available.join('\n\n')}`;
    sendWhatsAppToAll(toNumbers, msg);
  }
}

// WhatsApp bot is ready
client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  sendWhatsAppToAll(toNumbers, '✅ The Amul stock bot is now LIVE on Render!');

  checkAllProductsStock(); // Run once on startup
  setInterval(checkAllProductsStock, 300000); // Run every 5 minutes
});

// Initialize bot
client.initialize();

// Dummy Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ Amul WhatsApp bot is running on Render'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
