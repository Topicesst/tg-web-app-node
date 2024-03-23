const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const express = require('express');
const cors = require('cors');

const token = '6702075740:AAEDAjNrX1hVS5TJd9NqFYr-8FmQpWY0Lm0';
const webAppUrl = 'https://deft-caramel-01f656.netlify.app/';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Появиться кнопка, заполни форму', {
            reply_markup: {
                keyboard: [[{ text: 'Заполнить форму', web_app: { url: webAppUrl + 'form' } }]],
            },
        });
        await bot.sendMessage(chatId, 'Заходb в наш інтернет магазин по кнопкі нижче', {
            reply_markup: {
                inline_keyboard: [[{ text: 'Сделать заказ', web_app: { url: webAppUrl } }]],
            },
        });
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            console.log(data);
            await bot.sendMessage(
                chatId,
                `Дякуємо за надану інформацію!\n
                Ваше ПІБ: ${data?.name}\n
                Ваш номер телефону: ${data?.numberphone}\n
                Ваше місто: ${data?.country}\n
                Ваша вулиця: ${data?.street}\n
                \n\nВсю информацию вы получите в этом чате`,
            );
            // await bot.sendMessage(chatId, 'Ваше ПІБ: ' + data?.name);
            // await bot.sendMessage(chatId, 'Ваш номер телефону: ' + data?.numberphone);
            // await bot.sendMessage(chatId, 'Ваше місто: ' + data?.country);
            // await bot.sendMessage(chatId, 'Ваша вулиця: ' + data?.street);
            // setTimeout(async () => {
            //     await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате');
            // }, 3000);
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;
    console.log('web data result');
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму `,
            },
        });
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({});
    }
});

// app.listen(PORT, () => console.log('server started on PORT ' + PORT));
const PORT = 8000;
https.createServer(app).listen(PORT, () => {
    console.log(`server is runing at port ${PORT}`);
});
