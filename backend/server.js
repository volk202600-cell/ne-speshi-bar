/*
Simple backend (Node.js + Express)
- GET /api/menu      -> scrapes menu from MENU_SOURCE_URL (env) and returns JSON
- POST /api/order    -> receives { customer, items, total } and sends Telegram message using TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- Serves frontend files from ../frontend (for convenience)
*/
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

const MENU_SOURCE_URL = process.env.MENU_SOURCE_URL || 'https://menu.ps.me/s5_XOHGKU7w';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function scrapeMenu() {
  try {
    const resp = await axios.get(MENU_SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(resp.data);
    // Generic scraping: try to collect items with a name and price visible.
    // This is heuristic and may need adjustment for the specific site layout.
    const items = [];
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      // Look for price-like text (UAH, ₴ or numbers with decimals)
      if (/(\d+[,.]?\d*)\s*(грн|₴|uah)?$/i.test(text)) {
        // find a nearby title/name
        let name = '';
        // check parent siblings
        const parent = $(el).parent();
        name = parent.find('h1,h2,h3,h4,strong').first().text().trim();
        if (!name) {
          // try previous sibling
          name = $(el).prev().text().trim();
        }
        if (!name) {
          name = $(el).text().replace(/(\d+[,.]?\d*)\s*(грн|₴|uah)?$/i, '').trim();
        }
        // price
        const m = text.match(/(\d+[,.]?\d*)/);
        const price = m ? parseFloat(m[1].replace(',', '.')) : 0;
        if (name && price>0) {
          items.push({ id: 'i'+items.length, name: name, description: '', price: price });
        }
      }
    });
    // Fallback: if nothing found, return a sample menu
    if (items.length===0) {
      return {
        categories: [
          { id: 'pizzas', name: 'Піца', items: [{id:'p1',name:'Маргарита',description:'Томатний соус, сир',price:150},{id:'p2',name:'Пепероні',description:'Гостра ковбаса, сир',price:180}]},
          { id: 'drinks', name: 'Напої', items: [{id:'d1',name:'Кола 0.5л',description:'Пузирчаста',price:40},{id:'d2',name:'Вода 0.5л',description:'Мінеральна',price:30}]}
        ]
      };
    }
    // Group all items under one category
    return { categories: [{ id: 'menu', name: 'Меню', items }]};
  } catch (err) {
    console.error('Scrape failed:', err.message);
    return { categories: [{ id: 'sample', name: 'Приклад меню', items: [{id:'p1',name:'Піца тест',description:'Тестова піца',price:120}]}] };
  }
}

app.get('/api/menu', async (req, res) => {
  const menu = await scrapeMenu();
  res.json(menu);
});

app.post('/api/order', async (req, res) => {
  try {
    const { customer, items, total } = req.body;
    if (!customer || !items) return res.status(400).json({ error: 'Missing data' });
    // build message
    let text = `📩 *Нове замовлення — НЕ СПЕШИ БАР*\n\n`;
    text += `*Ім'я:* ${customer.name}\n`;
    text += `*Телефон:* ${customer.phone}\n`;
    text += `*Адреса:* ${customer.address || '—'}\n\n`;
    text += `*Позиції:*\n`;
    items.forEach(it => {
      text += `• ${it.name} × ${it.qty} — ${it.price} грн\n`;
    });
    text += `\n*Сума:* ${total} грн\n`;
    text += `\n🕒 ${new Date().toLocaleString()}\n`;
    // send to telegram
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('Telegram token/chat id not set. Skipping send.');
    } else {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(url, {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      });
    }
    // respond to client
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Backend listening on ${PORT}`));