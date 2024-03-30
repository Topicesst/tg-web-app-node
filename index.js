const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Замініть цей токен на реальний токен вашого бота
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
        await bot.sendMessage(chatId, 'Нижче з\'явиться кнопка, заповніть форму', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Заповніть форму', web_app: { url: webAppUrl + 'form' } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Заходьте в наш інтернет магазин за кнопкою нижче', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Зробити замовлення', web_app: { url: webAppUrl } }]
                ]
            }
        });
    }

    // Обробник для даних, отриманих через tg.sendData
    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            console.log(data);

            // Тут можна відформатувати відповідь, як ви хочете відправити користувачеві
            let responseText = `Вітаємо з покупкою! Ви замовили: \n`;
            data.products.forEach((product) => {
                responseText += `${product.title}\n`;
            });
            responseText += `На суму: ${data.totalPrice}₴`;

            await bot.sendMessage(chatId, responseText);
        } catch (e) {
            console.error(e);
            await bot.sendMessage(chatId, 'Виникла проблема при обробці вашого замовлення.');
        }
    }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
