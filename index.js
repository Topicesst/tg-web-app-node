const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Замініть на ваш токен
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

let lastChatId = null;

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  lastChatId = chatId; 

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
  } else if (text.match(/\/echo (.+)/)) {
    const [, echoText] = text.match(/\/echo (.+)/);
    await bot.sendMessage(chatId, `Ви сказали: ${echoText}`);
  } else if (msg?.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      await bot.sendMessage(chatId, '*Дякуємо за надану інформацію!*', { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*Ваше ПІБ:* _${data?.name}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*Ваш номер телефону:* _${data?.numberphone}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*Ваше місто:* _${data?.city}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*Ваша адреса:* _${data?.street}_`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, `*Вартість доставки:* _${data?.deliveryPrice}_`, { parse_mode: 'Markdown' });
    } catch (e) {
      console.error(e);
    }
  }
});

app.post('/web-data', async (req, res) => {
  const { queryId, products = [], totalPrice } = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успішна покупка',
      input_message_content: {
        message_text: [
          '*Вітаємо з покупкою!*',
          `*Сума замовлення:* _${totalPrice}₴_`,
          '*Що саме ви замовили:*',
          ...products.map(item => `• _${item.title}_`).join('\n')
        ].join('\n'),
        parse_mode: 'Markdown'
      }
    });

    if (lastChatId) {
      await bot.sendMessage(lastChatId, `*Загальна сума замовлення включаючи доставку:* _${totalPrice}₴_`, { parse_mode: 'Markdown' });
    }

    res.status(200).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({});
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
