const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Replace the token with your actual token
const token = '6702075740:AAEDAjNrX1hVS5TJd9NqFYr-8FmQpWY0Lm0';
const webAppUrl = 'https://deft-caramel-01f656.netlify.app/';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());

const corsOptions = {
  origin: 'https://deft-caramel-01f656.netlify.app',
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Handle the '/start' command
  if (text === '/start') {
    // Send a message with a button to fill out the form
    await bot.sendMessage(chatId, 'Нижче з\'явиться кнопка, заповніть форму', {
      reply_markup: {
        keyboard: [
          [{ text: 'Заповнити форму', web_app: { url: webAppUrl + 'form' } }],
        ],
        one_time_keyboard: true
      }
    });
  }

  // Handle the form data reception
  if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log(data);
      await bot.sendMessage(chatId, 'Дякуємо за надану інформацію! Очікуйте на продовження...');

      // Delay to simulate processing time
      setTimeout(async () => {
        // Send a message with a button to the online store
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

// POST endpoint for the web data
app.post('/web-data', async (req, res) => {
  const { queryId, products = [], totalPrice } = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успішна покупка',
      input_message_content: {
        message_text: `Вітаю з покупкою! Ви придбали їжу на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
      }
    });
    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({});
  }
});

// Start the Express server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
