const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

// Налаштування Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDgX6-udKrNWbG2fvA7Czc667S9n-nqOEk",
  authDomain: "tg-web-app-data-base.firebaseapp.com",
  projectId: "tg-web-app-data-base",
  storageBucket: "tg-web-app-data-base.appspot.com",
  messagingSenderId: "193829235520",
  appId: "1:193829235520:web:48f285016b60dad1ea68a5",
  measurementId: "G-HFBWVC29D1"
};

const fbapp = initializeApp(firebaseConfig);
const db = getFirestore(fbapp);

let price = 0;

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

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    await bot.sendMessage(chatId, "Нижче з'явиться кнопка, заповніть форму", {
      reply_markup: {
        keyboard: [
          [{ text: "Заповнити форму", web_app: { url: webAppUrl + "form" } }],
        ],
        one_time_keyboard: true,
      },
    });
  }

  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      price = data.deliveryPrice; // Оновлення ціни доставки

      const userId = msg.from.id;
      const order = {
        name: data.name,
        phone: data.numberphone,
        city: data.city,
        address: data.street,
        deliveryMethod: data.deliveryMethod,
        deliveryCost: price,
        deliveryTime: data.deliveryTime,
        timestamp: new Date().toISOString()
      };

      const usersRef = doc(db, "users", userId.toString());
      const ordersRef = collection(usersRef, "orders");
      await setDoc(doc(ordersRef), order);

      await bot.sendMessage(chatId, '*Дякуємо за надану інформацію!*', { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*👤️ Ваше ПІБ:* _${data.name}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*📱️ Ваш номер телефону:* _${data.numberphone}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*🏙️ Ваше місто:* _${data.city}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*📍 Ваша адреса:* _${data.street}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*🚕 Метод доставки:* _${data.deliveryMethod}_`, { parse_mode: 'Markdown' });

      if (data.deliveryMethod !== "pickup") {
        await bot.sendMessage(chatId, `*💵 Вартість доставки:* _${price}_₴`, { parse_mode: "Markdown" });
        await bot.sendMessage(chatId, `*⌚ Приблизний час доставки:* _${data.deliveryTime}_`, { parse_mode: "Markdown" });
      }

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
      await bot.sendMessage(chatId, "Сталася помилка під час обробки вашого замовлення.");
    }
  }
});

app.post('/web-data', async (req, res) => {
  const { queryId, products, totalPrice } = req.body;
  let deliveryPrice = req.body.deliveryPrice; 

  if (typeof deliveryPrice === 'string') {
    deliveryPrice = parseFloat(deliveryPrice.replace(/[^\d.]/g, ''));
  }

  if (isNaN(deliveryPrice)) {
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
          `*Вартість доставки:* _${deliveryPrice}₴_`,
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
