// Токены берутся из ENV окружения

export default {
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN ?? '',
  TG_CHANNEL_ID: process.env.TG_CHANNEL_ID ?? '',
};
