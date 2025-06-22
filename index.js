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

// Display QR for login
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

// Products to track
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

// Send message to all target numbers
function sendWhatsAppToAll(numbers, message) {
  numbers.forEach(number => {
    client.sendMessage(number, message)
      .then(() => console.log(`✅ Sent to ${number}`))
      .catch(err => console.error(`❌ Error sending to ${number}:`, err));
  });
}

// Check stock status of all products
async function checkAllProductsStock() {
  let available = [];

  for (const product of products) {
    try {
      const res = await axios.get(product.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $ = cheerio.load(res.data);

      // ✅ Accurate check: structured schema
      const isOutOfStock = $('link[itemprop="availability"]').attr('href')?.includes('OutOfStock');

      if (!isOutOfStock) {
        available.push(`✅ *${product.name}*\n${product.url}`);
        console.log(`🟢 ${product.name} is IN STOCK!`);
      } else {
        console.log(`❌ ${product.name} is still SOLD OUT.`);
      }
    } catch (err) {
      console.error(`❌ Error checking ${product.name}:`, err.message);
    }
  }

  if (available.length > 0) {
    const msg = `🟢 *THE FOLLOWING PRODUCTS ARE NOW IN STOCK!*\n\n${available.join('\n\n')}`;
    sendWhatsAppToAll(toNumbers, msg);
  } else {
    console.log('🔁 All tracked products are still sold out.');
  }
}

// When WhatsApp bot is ready
client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  sendWhatsAppToAll(toNumbers, '✅ The Amul stock bot is now LIVE on Render!');
  checkAllProductsStock(); // Initial check
  setInterval(checkAllProductsStock, 300000); // Every 5 minutes
});

// Initialize the bot
client.initialize();

// Dummy Express server to keep Render alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ Amul WhatsApp bot is running on Render'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
