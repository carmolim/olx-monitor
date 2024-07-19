require("dotenv").config();

let config = {};

config.urls = ["url1", "url2"];

// this tool can help you create the interval string:
// https://tool.crontap.com/cronjob-debugger

config.interval = "*/5 * * * *";
config.telegramChatID = process.env.TELEGRAM_CHAT_ID;
config.telegramToken = process.env.TELEGRAM_TOKEN;
config.dbFile = "../data/ads.db";
config.titleExcludes = ["", ""]; // Exclude ads with these words in the title, word are case insensitive
config.titleContains = []; // Only show ads with these words in the title (if empty it will not filter) Example: ["iphone", "samsung"], words are case insensitive

config.logger = {
  logFilePath: "../data/scrapper.log",
  timestampFormat: "YYYY-MM-DD HH:mm:ss",
};

module.exports = config;
