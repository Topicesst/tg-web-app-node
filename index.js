const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAIN5YHKjJk6eCU00XEjGkrFHrxQyITgd4",
  authDomain: "tg-web-app-bot-8d79b.firebaseapp.com",
  projectId: "tg-web-app-bot-8d79b",
  storageBucket: "tg-web-app-bot-8d79b.appspot.com",
  messagingSenderId: "494356709244",
  appId: "1:494356709244:web:d12c89285dac6add6d6ef9",
  measurementId: "G-M9J3RSM23P"
};
const fbapp = initializeApp(firebaseConfig);
const db = getFirestore(fbapp);

const token = "6702075740:AAEDAjNrX1hVS5TJd9NqFYr-8FmQpWY0Lm0"; 
const webAppUrl = "https://deft-caramel-01f656.netlify.app/";

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors({
  origin: 'https://deft-caramel-01f656.netlify.app',
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') {
    await bot.sendMessage(chatId, 'Нижче з\'явиться кнопка, заповніть форму', {
      reply_markup: {
        keyboard: [
          [{ text: 'Заповнити форму', web_app: { url: webAppUrl + 'form' } }],
        ],
        one_time_keyboard: true
      }
    });
  }

  // Опрацювання даних веб-додатка
  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      // Зберігаємо дані в Firestore
      const docRef = doc(collection(db, "orders"));
      await setDoc(docRef, data);

      let deliveryMethodText = '';
      switch(data.deliveryMethod) {
        case 'courier':
          deliveryMethodText = 'Доставка кур\'єром';
          break;
        case 'pickup':
          deliveryMethodText = 'Самовивіз';
          break;
        default:
          deliveryMethodText = 'Метод доставки не вибрано';
      }

      // Відправляємо відповідь користувачу
      await bot.sendMessage(chatId, '*Дякуємо за надану інформацію!*', { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*👤️ Ваше ПІБ:* _${data?.name}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*📱️ Ваш номер телефону:* _${data?.numberphone}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*🏙️ Ваше місто:* _${data?.city}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*📍 Ваша адреса:* _${data?.street}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*🚕 Метод доставки:* _${deliveryMethodText}_`, { parse_mode: 'Markdown' });

      if (data.deliveryMethod !== 'pickup') {
        await bot.sendMessage(chatId, `*💵 Вартість доставки:* _${data?.deliveryPrice}_`, { parse_mode: 'Markdown' });
        await bot.sendMessage(chatId, `*⌚ Приблизний час доставки:* _${data.deliveryTime ? `${data.deliveryTime}` : 'Час доставки не вказано'}_`, { parse_mode: 'Markdown' });
      }

      // Чекаємо 3 секунди перед надсиланням наступного повідомлення
      setTimeout(async () => {
        await bot.sendMessage(chatId, 'Заходьте в наш інтернет магазин за кнопкою нижче', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Зробити замовлення', web_app: { url: webAppUrl } }],
            ]
          }
        });
      }, 3000); 

    } catch (e) {
      console.error(e);
    }
  }
});

app.post('/web-data', async (req, res) => {
  const { queryId, products, totalPrice } = req.body;
  let deliveryPrice = req.body.deliveryPrice; // Припустимо, що deliveryPrice приходить як рядок "XX.XX грн"

  // Перевірка на наявність deliveryPrice та конвертація у числове значення
  if (typeof deliveryPrice === 'string') {
    deliveryPrice = parseFloat(deliveryPrice.replace(/[^\d.]/g, ''));
    deliveryPrice = parseFloat(deliveryPrice);
  }

  if (isNaN(deliveryPrice)) {
    // Якщо deliveryPrice не є числом, встановлюємо його як 0
    deliveryPrice = 0;
  }

  const numericTotalPrice = parseFloat(totalPrice);
  const totalOrderPrice = numericTotalPrice + deliveryPrice;

  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успішна покупка',
      input_message_content: {
        message_text: [
          '*Вітаємо з покупкою!*',
          `*Сума замовлення:* _${numericTotalPrice.toFixed(2)}₴_`,
          `*Вартість доставки:* _${deliveryPrice.toFixed(2)}₴_`,
          `*Загальна сума оплати:* _${totalOrderPrice.toFixed(2)}₴_`,
          '*Що саме ви замовили:*',
          ...products.map(item => `• _${item.title}_`)
        ].join('\n'),
        parse_mode: 'Markdown'
      }
    });

    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
