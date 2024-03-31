const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '6702075740:AAEDAjNrX1hVS5TJd9NqFYr-8FmQpWY0Lm0';
const webAppUrl =  'https://deft-caramel-01f656.netlify.app/';

const bot = new TelegramBot(token, {polling: true});
const app = express();

app.use(express.json());
const corsOptions = {
  origin: [
    'https://deft-caramel-01f656.netlify.app',
  ],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization', 
    'Cookies'
  ],
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
};
app.use(cors(corsOptions));

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if(text === '/start') {
        await bot.sendMessage(chatId, 'Нижче з\'явиться кнопка, заповніть форму', {
            reply_markup: {
                keyboard: [
                    [{text: 'Заповнити форму', web_app: {url: webAppUrl + 'form'}}]
                ]
            }
        })

        await bot.sendMessage(chatId, 'Заходьте в наш інтернет магазин за кнопкою нижче', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Зробити замовлення', web_app: {url: webAppUrl}}]
                ]
            }
        })
    }

    if(msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data)
            console.log(data)
            await bot.sendMessage(chatId, 'Дякуємо за надану інформацію! ')
            await bot.sendMessage(chatId, 'Ваше ПІБ: ' + data?.name);
            await bot.sendMessage(chatId, 'Ваш номер телефону: ' + data?.numberphone);
            await bot.sendMessage(chatId, 'Ваше місто: ' + data?.country);
            await bot.sendMessage(chatId, 'Ваша вулиця: ' + data?.street);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю інформацію передано, тепер ви можете замовити їжу');
            }, 3000)
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const {queryId, products = [], totalPrice} = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успішна покупка',
            input_message_content: {
                message_text: `Вітаю з покупкою! Ви придбали їжу на суму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
            }
        })
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({})
    }
})

const PORT = 8000;

app.listen(PORT, () => console.log('сервер запущено на порту ' + PORT))
