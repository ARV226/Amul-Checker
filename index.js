const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const express = require('express');

// WhatsApp client setup with local auth
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// QR code on terminal
client.on('qr', qr => {
  console.log('📲 Scan this QR code to login:');
  qrcode.generate(qr, { small: true });
});

// WhatsApp numbers to notify (add your full numbers with country code)
const toNumbers = [
  '918377884512@c.us',
  '919711720145@c.us',
  '918287154627@c.us'
];

// Function to send message to all numbers
function sendWhatsAppToAll(numbers, message) {
  numbers.forEach(number => {
    client.sendMessage(number, message)
      .then(() => console.log(`✅ Sent to ${number}`))
      .catch(err => console.error(`❌ Error sending to ${number}:`, err));
  });
}

// Check Amul stock site for available products
async function checkAmulStock() {
  try {
    const res = await axios.get("https://shop.amul.com/en/browse/protein", {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = res.data;

    const regex = /<div class="product-item">(.*?)<\/div>\s*<\/div>/gs;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const block = match[1];
      const nameMatch = block.match(/product-item-link[^>]*>(.*?)<\/a>/);
      const priceMatch = block.match(/<span[^>]*class="price"[^>]*>₹(.*?)<\/span>/);
      const stockMatch = block.match(/<div[^>]*class="stock"[^>]*>(.*?)<\/div>/);

      if (stockMatch && stockMatch[1].includes("In Stock")) {
        const name = nameMatch ? nameMatch[1].trim() : "Unknown Product";
        const price = priceMatch ? priceMatch[1].trim() : "Unknown";
        const linkMatch = block.match(/href="(\/en\/.*?)"/);
        const link = linkMatch ? `https://shop.amul.com${linkMatch[1]}` : "N/A";

        const msg = `🟢 *THE PRODUCT IS IN STOCK!*\n*${name}*\nPrice: ₹${price}\nLink: ${link}`;
        sendWhatsAppToAll(toNumbers, msg);
      }
    }
  } catch (e) {
    console.error("❌ Stock check failed:", e.message);
  }
}

// When WhatsApp client is ready
client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  checkAmulStock(); // Initial check
  setInterval(checkAmulStock, 300000); // Every 5 minutes
});

// Start WhatsApp bot
client.initialize();

// Dummy Express server to keep Render happy
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_, res) => {
  res.send('✅ Amul WhatsApp bot is running on Render');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});
