import requests
from bs4 import BeautifulSoup
import time

def send_whatsapp(product_name, price, quantity, available_till, link):
    number = '91XXXXXXXXXX'  # ← Your WhatsApp number
    msg = f"THE PRODUCT IS IN STOCK!\n{product_name}, ₹{price}, {quantity}, {available_till}, {link}"
    url = f'https://api.callmebot.com/whatsapp.php?phone={number}&text={requests.utils.quote(msg)}&apikey=free'
    requests.get(url)

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

# Loop forever
while True:
    try:
        check_amul_stock()
    except Exception as e:
        print("Error:", e)
    time.sleep(30)  # Check every 30 seconds
