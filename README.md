# GoStreetBot

A bot that connects Crosst and Telegram.

## How to Run

- Clone this repo
- Fill in `.env` according to `.env.example`. You can refer to the following instructions.
  - `BOT_TOKEN`: The token obtained from BotFather.
  - `CROSST_NICK`: The nickname you want to use in Crosst channel.
  - `CROSST_PASSWD`: A string that will be used to generate a _salt_, which acts as the unique identifier in Crosst.
  - `ADMIN_ID`: Your Telegram account UID.
  - `CROSST_CHANNEL`: The Crosst channel you to join with the bot.
  - `SMMS_TOKEN`: The token obtained from sm.ms. You need to set this if you want to sync images.
- Run `npm install && npm start`.
- You are good to go. Receive and send messages via your bot, and watch the bot synchronize them to Crosst.

**Note: This is a fan project. It doesn't represent the official of Crosst.**