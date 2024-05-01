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
  const text = msg.text;

  if (text === "/start") {
    console.log('Start + ' + JSON.stringify(msg));

    try {
      let user = "";

      const firstName = msg.from.first_name || " ";
      const lastName = msg.from.last_name || " ";
      const userId = msg.from.id;
      
      const tmpId = Math.random().toString(36).substring(4);
      const date = new Date();
      const textDate = date.getHours() + ':' + date.getMinutes() + '  ' + date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();
      user = {        
        firstName: firstName,
        lastName: lastName,
        id: userId,        
        isChecked: '_UserWasChecked_0777',
        date: textDate
      };

      const usersRef = collection(db, "users");
      await setDoc(doc(usersRef, tmpId), user);
      
    } catch (error) {
      console.log(error);
    }

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

      price = data.deliveryPrice; // Получаем ее из Фронта.

      let deliveryMethodText = "";
      switch (data.deliveryMethod) {
        case "courier":
          deliveryMethodText = "Доставка кур'єром";
          break;
        case "pickup":
          deliveryMethodText = "Самовивіз";
          break;
        default:
          deliveryMethodText = "Метод доставки не вибрано";
      }

      // Відправка повідомлень
      await bot.sendMessage(chatId, "*Дякуємо за надану інформацію!*", {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(chatId, `*👤️ Ваше ПІБ:* _${data?.name}_`, {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(
        chatId,
        `*📱️ Ваш номер телефону:* _${data?.numberphone}_`,
        { parse_mode: "Markdown" }
      );
      await bot.sendMessage(chatId, `*🏙️ Ваше місто:* _${data?.city}_`, {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(chatId, `*📍 Ваша адреса:* _${data?.street}_`, {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(
        chatId,
        `*🚕 Метод доставки:* _${deliveryMethodText}_`,
        { parse_mode: "Markdown" }
      );

      if (data.deliveryMethod !== "pickup") {
        // Тільки для методу доставки, який не є самовивозом
        let deliveryTimeText = data.deliveryTime
          ? data.deliveryTime.startsWith
            ? `${data.deliveryTime}`
            : `${data.deliveryTime}`
          : "Час доставки не вказано";

        await bot.sendMessage(
          chatId,
          `*💵 Вартість доставки:* _${price}_`, // Используем ее
          { parse_mode: "Markdown" }
        );
        await bot.sendMessage(
          chatId,
          `*⌚ Приблизний час доставки:* _${
            data.deliveryTime
              ? `${data.deliveryTime}`
              : "Час доставки не вказано"
          }_`,
          { parse_mode: "Markdown" }
        );
      } else {
        // Додаткова інформація для самовивозу
        await bot.sendMessage(
          chatId,
          `*📍 Адреса для самовивозу:* _вулиця Руська, 209-Б, Чернівці, Чернівецька область, Україна_`,
          { parse_mode: "Markdown" }
        );
      }

      setTimeout(async () => {
        await bot.sendMessage(
          chatId,
          "Заходьте в наш інтернет магазин за кнопкою нижче",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Зробити замовлення", web_app: { url: webAppUrl } }],
              ],
            },
          }
        );
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
