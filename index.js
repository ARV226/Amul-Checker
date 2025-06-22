const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

// Initialize client with saved session
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  console.log('📲 Scan this QR code to login:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
  checkAmulStock(); // Initial check
  setInterval(checkAmulStock, 300000); // Every 5 minutes
});

// Replace with your WhatsApp number (this sends TO your own WhatsApp)
const toNumbers = ['918377884512@c.us', '919711720145@c.us', '918287154627@c.us'];

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

        for (const number of toNumbers) {
          client.sendMessage(number, msg);
        }
      }
    }
  } catch (e) {
    console.error("❌ Stock check failed:", e.message);
  }
}

client.initialize();
