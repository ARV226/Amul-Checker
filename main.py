import requests
from bs4 import BeautifulSoup
import time
import threading
from flask import Flask

# Start Flask dummy server to keep Render happy
app = Flask(__name__)

@app.route('/')
def home():
    return "Amul Stock Bot is running"

def send_whatsapp(product_name, price, quantity, available_till, link):
    numbers = ['918377884512', '919711720145', '918287154627']  # Replace with all your numbers
    msg = f"THE PRODUCT IS IN STOCK!\n{product_name}, ₹{price}, {quantity}, {available_till}, {link}"
    for number in numbers:
        try:
            url = f'https://api.callmebot.com/whatsapp.php?phone={number}&text={requests.utils.quote(msg)}&apikey=free'
            requests.get(url)
        except Exception as e:
            print(f"Error sending to {number}: {e}")

def check_amul_stock():
    url = "https://shop.amul.com/en/browse/protein"
    headers = {'User-Agent': 'Mozilla/5.0'}
    soup = BeautifulSoup(requests.get(url, headers=headers).text, 'html.parser')
    products = soup.find_all('div', class_='product-item')

    for product in products:
        name = product.find('a', class_='product-item-link').text.strip()
        price = product.find('span', class_='price').text.replace('₹','').strip()
        quantity = product.find('div', class_='product-pack-size')
        quantity = quantity.text.strip() if quantity else 'N/A'
        stock = product.find('div', class_='stock')
        status = stock.text.strip() if stock else 'OUT OF STOCK'
        link = product.find('a', class_='product-item-link')['href']
        link = 'https://shop.amul.com' + link

        if "In Stock" in status:
            available_till = product.find('div', class_='available-till')
            available_till = available_till.text.strip() if available_till else "N/A"
            send_whatsapp(name, price, quantity, available_till, link)

def run_checker():
    while True:
        try:
            check_amul_stock()
        except Exception as e:
            print("Error:", e)
        time.sleep(300)

if __name__ == '__main__':
    # Run stock checker in background
    threading.Thread(target=run_checker).start()

    # Start Flask server on Render's expected port
    import os
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
