/* eslint-disable no-restricted-syntax */
import store from '@store/index';
import Bot from '@bots/telegram';

export const pushToDelete = (chat_id: number, id: number) => {
  setTimeout(() => {
    store.bot_messages.push({
      chat_id,
      id,
    });
  }, 1000 * 60 * 0.5);
};

export const removeFromDelete = (msg: { chat_id: number, id: number }) => {
  store.bot_messages = store.bot_messages
    .filter((m) => m.chat_id !== msg.chat_id && m.id !== msg.id);
};

export default () => {
  if (store.bot_messages.length === 0) return;
  for (const msg of store.bot_messages) {
    Bot.telegram.deleteMessage(msg.chat_id, msg.id)
      .then(() => removeFromDelete(msg))
      .catch((err) => {
        console.log(err);
        if (err.desciprion === 'Bad Request: message to delete not found') removeFromDelete(msg);
      });
  }
};
