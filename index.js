const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const puppeteer = require('puppeteer');

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// WhatsApp numbers to notify
const toNumbers = [
  '918377884512@c.us',
  '919711720145@c.us',
  '918287154627@c.us'
];

// Product list
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

// Send WhatsApp message
function sendWhatsAppToAll(numbers, message) {
  numbers.forEach(number => {
    client.sendMessage(number, message)
      .then(() => console.log(`✅ Sent to ${number}`))
      .catch(err => console.error(`❌ Failed to send to ${number}:`, err));
  });
}

// Real stock checker using Puppeteer
async function checkAllProductsStock() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const available = [];

  for (const product of products) {
    try {
      const page = await browser.newPage();
      await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 0 });

      const isSoldOut = await page.evaluate(() => {
        const el = document.querySelector('.alert.alert-danger.mt-3');
        return el && el.innerText.toLowerCase().includes('sold out');
      });

      if (!isSoldOut) {
        available.push(`✅ *${product.name}*\n${product.url}`);
        console.log(`🟢 ${product.name} is IN STOCK!`);
      } else {
        console.log(`❌ ${product.name} is SOLD OUT.`);
      }

      await page.close();
    } catch (err) {
      console.error(`⚠️ Error checking ${product.name}:`, err.message);
    }
  }

  await browser.close();

  // Notify if any item is in stock
  if (available.length > 0) {
    const msg = `🟢 *THE FOLLOWING PRODUCTS ARE NOW IN STOCK!*\n\n${available.join('\n\n')}`;
    sendWhatsAppToAll(toNumbers, msg);
  }
}

// QR code login
client.on('qr', qr => {
  console.log('📲 Scan this QR code to login:');
  qrcode.generate(qr, { small: true });
});

// On bot ready
client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  sendWhatsAppToAll(toNumbers, '✅ The Amul stock bot is now LIVE on Render!');

  checkAllProductsStock(); // Initial check
  setInterval(checkAllProductsStock, 300000); // Check every 5 mins
});

// Start WhatsApp bot
client.initialize();

// Dummy Express server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ Amul WhatsApp bot is running on Render'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
