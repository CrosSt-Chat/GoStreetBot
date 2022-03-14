# GoStreetBot

A bot that connects Crosst and Telegram.

## How to Run

- Clone this repo
- Fill in `.env` according to `.env.example`. You can also refer to the following instructions.
  - `BOT_TOKEN`: The token obtained from BotFather.
  - `CROSST_NICK`: The nickname you want for your bot in Crosst channels.
  - `CROSST_PASSWD`: A string that will be used to generate a _salt_, which acts as the unique identifier in Crosst.
  - `ADMIN_ID`: Your Telegram account UID.
  - `CROSST_CHANNEL`: The Crosst channel you want your bot to join.
  - `GROUP_ID`: Your linked Telegram group UID.
- Run `npm install && npm start`.
- You are good to go. Send messages in Crosst channels and your Telegram group, meanwhile watching the bot synchronize them!

**Note: This is a fan project. It doesn't represent the official of Crosst.**