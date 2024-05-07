const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, collectionGroup } = require('firebase/firestore');

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

const corsOptions = {
  origin: "https://deft-caramel-01f656.netlify.app",
  methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors({
  origin: 'https://deft-caramel-01f656.netlify.app',
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);

      const price = data.deliveryPrice; // Значення отримується з фронтенду.

      let deliveryMethodText = data.deliveryMethod === "courier" ? "Доставка кур'єром" :
                               data.deliveryMethod === "pickup" ? "Самовивіз" :
                               "Метод доставки не вибрано";

      const userData = {
        name: data.name,
        phone: data.numberphone,
        city: data.city,
        address: data.street,
        deliveryMethod: data.deliveryMethod,
        deliveryPrice: price,
        deliveryTime: data.deliveryTime || "Час доставки не вказано"
      };

      const usersRef = collection(db, "users");
      const userId = msg.from.id.toString(); // Використовуємо ID користувача як унікальний ключ
      await setDoc(doc(usersRef, userId), userData, { merge: true });

      await bot.sendMessage(chatId, "*Дякуємо за надану інформацію!*", { parse_mode: "Markdown" });
      await bot.sendMessage(chatId, `*👤️ Ваше ПІБ:* _${data.name}_`, { parse_mode: "Markdown" });
      await bot.sendMessage(chatId, `*📱️ Ваш номер телефону:* _${data.numberphone}_`, { parse_mode: "Markdown" });
      await bot.sendMessage(chatId, `*🏙️ Ваше місто:* _${data.city}_`, { parse_mode: "Markdown" });
      await bot.sendMessage(chatId, `*📍 Ваша адреса:* _${data.street}_`, { parse_mode: "Markdown" });
      await bot.sendMessage(chatId, `*🚕 Метод доставки:* _${deliveryMethodText}_`, { parse_mode: "Markdown" });

      setTimeout(async () => {
        await bot.sendMessage(chatId, "Заходьте в наш інтернет магазин за кнопкою нижче", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Зробити замовлення", web_app: { url: webAppUrl } }],
            ],
          },
        });
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  }
});


app.post('/web-data', async (req, res) => {
  const { queryId, products, totalPrice } = req.body;
  let deliveryPrice = req.body.deliveryPrice; 

  if (typeof deliveryPrice === 'string') {
    deliveryPrice = parseFloat(deliveryPrice.replace(/[^\d.]/g, ''));
    deliveryPrice = parseFloat(deliveryPrice);
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
          `*Вартість доставки:* _${price}₴_`,
         `*Загальна сума оплати:* _${parseInt(totalPrice) + parseInt(price)}₴_`,
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
