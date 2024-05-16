const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} = require("firebase/firestore");

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

let price = 0; // Глобальна змінна. Доступ до неї з будь-якої частини коду.
let userIdGlobal = "";
let dataOrderGlobal = {};
let fioGlobal = "";
let phoneGlobal = "";
let cityGlobal = "";
let addressGlobal = "";
let deliveryMethodGlobal = "";
let deliveryTimeGlobal = "";
let deliveryPriceGlobal = "";

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
  userIdGlobal = msg.from.id;

  if (text === "/start") {
    try {
      let user = {};
      const firstName = msg.from.first_name || " ";
      const lastName = msg.from.last_name || " ";
      const userId = msg.from.id;

      const tmpId = Math.random().toString(36).substring(4);
      const date = new Date();
      const textDate =
        date.getHours() +
        ":" +
        date.getMinutes() +
        "  " +
        date.getDate() +
        "." +
        date.getMonth() +
        "." +
        date.getFullYear();
      user = {
        firstName: firstName,
        lastName: lastName,
        id: userId,
        isChecked: "_UserWasChecked_0777",
        date: textDate,
        orders: [],
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
    const data = JSON.parse(msg.web_app_data.data);
    userIdGlobal = msg.from.id;

    fioGlobal = data.name;
    phoneGlobal = data.numberphone;
    cityGlobal = data.city;
    addressGlobal = data.street;
    deliveryMethodGlobal = data.deliveryMethod;
    deliveryTimeGlobal = data.deliveryTime;
    deliveryPriceGlobal = data.deliveryPrice;
    price = data.deliveryPrice;

    let deliveryMethodText = "";
    switch (deliveryMethodGlobal) {
      case "courier":
        deliveryMethodText = "Доставка кур'єром";
        break;
      case "pickup":
        deliveryMethodText = "Самовивіз";
        break;
      default:
        deliveryMethodText = "Метод доставки не вибрано";
    }

    try {
      await bot.sendMessage(chatId, "*Дякуємо за надану інформацію!*", {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(chatId, `*👤️ Ваше ПІБ:* _${fioGlobal}_`, {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(
        chatId,
        `*📱️ Ваш номер телефону:* _${phoneGlobal}_`,
        { parse_mode: "Markdown" }
      );
      await bot.sendMessage(chatId, `*🏙️ Ваше місто:* _${cityGlobal}_`, {
        parse_mode: "Markdown",
      });
      await bot.sendMessage(chatId, `*📍 Ваша адреса:* _${addressGlobal}_`, {
        parse_mode: "Markdown"
      });
      await bot.sendMessage(
        chatId,
        `*🚕 Метод доставки:* _${deliveryMethodText}_`,
        { parse_mode: "Markdown" }
      );

      if (deliveryMethodGlobal !== "pickup") {
        let deliveryTimeText = deliveryTimeGlobal
          ? deliveryTimeGlobal.startsWith
            ? `${deliveryTimeGlobal}`
            : `${deliveryTimeGlobal}`
          : "Час доставки не вказано";

        await bot.sendMessage(
          chatId,
          `*💵 Вартість доставки:* _${price}_`,
          { parse_mode: "Markdown" }
        );
        await bot.sendMessage(
          chatId,
          `*⌚ Приблизний час доставки:* _${
            deliveryTimeGlobal
              ? `${deliveryTimeGlobal}`
              : "Час доставки не вказано"
          }_`,
          { parse_mode: "Markdown" }
        );
      } else {
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

    try {
      const docRef = collection(db, "users");
      const q = query(docRef, where("id", "==", userIdGlobal));
      const querySnapshot = await getDocs(q);
      let idCollectionElement = "";
      querySnapshot.forEach((doc) => {
        if (doc.data().id === userIdGlobal) {
          idCollectionElement = doc.id;
        }
      });

      if (idCollectionElement !== "") {
        const addDocRef = doc(db, "users", idCollectionElement);
        await updateDoc(addDocRef, {
          "fio": fioGlobal,
          "phone": phoneGlobal,
          "city": cityGlobal,
          "address": addressGlobal,
          "deliveryMethod": deliveryMethodText,
          "deliveryTime": deliveryTimeGlobal,
          "deliveryPrice": price,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
});

app.post("/web-data", async (req, res) => {
  const { queryId, products = [], totalPrice } = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "Успішна покупка",
      input_message_content: {
        message_text: [
          "*Вітаємо з покупкою!*",
          `*Сума замовлення:* _${totalPrice}₴_`,
          `*Вартість доставки:* _${price}₴_`,
          `*Загальна сума оплати:* _${
            parseInt(totalPrice) + parseInt(price)
          }₴_`,
          "*Що саме ви замовили:*",
          ...products.map((item) => `• _${item.title}_`),
        ].join("\n"),
        parse_mode: "Markdown",
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({});
  }

  try {
    const docRef = collection(db, "users");
    const q = query(docRef, where("id", "==", userIdGlobal));
    const querySnapshot = await getDocs(q);
    let idCollectionElement = "";
    querySnapshot.forEach((doc) => {
      if (doc.data().id === userIdGlobal) {
        idCollectionElement = doc.id;
      }
    });

    if (idCollectionElement !== "") {
      const addDocRef = doc(db, "users", idCollectionElement);
      await updateDoc(addDocRef, {
        orders: arrayUnion({
          date: new Date(),
          productsList: products,
          price: totalPrice,
        }),
      });
    }
  } catch (error) {
    alert(error);
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
