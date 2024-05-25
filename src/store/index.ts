type Store = {
  bot_messages: { chat_id: number, id: number }[];
  mediaGroups: {
    [key: string]: {
      urls: URL[],
      timers: NodeJS.Timeout[]
    }
  }
};

export default {
  bot_messages: [],
  mediaGroups: {},
} as Store;
