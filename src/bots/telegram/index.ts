/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  Composer, Input, Telegraf,
} from 'telegraf';
import constants from '@utils/constants';
import { message } from 'telegraf/filters';
// @ts-ignore
import mediaGroup from 'telegraf-media-group';
import { delete_bot_messages } from './workers';
import { pushToDelete } from './workers/delete_bot_messages';

const Bot = new Telegraf(constants.TG_BOT_TOKEN);

let apiLimit = 0;

const work = () => {
  setTimeout(() => {
    delete_bot_messages();
    work();
  }, 1000 * 60 * 0.5);
};

const reloadApiLimit = () => setTimeout(() => {
  apiLimit = 0;
  reloadApiLimit();
}, 1000 * 60);

Bot.launch(() => {
  console.log('Bot started');
  work();
  reloadApiLimit();
});

Bot.use(mediaGroup());

const composer = new Composer();

// @ts-ignore
composer.on('media_group', async (ctx) => {
  const group = [];
  const toCopy = [];
  const messages: number[] = [];

  console.log(ctx);

  // @ts-ignore
  for (const media of ctx.mediaGroup
  ) {
    messages.push(media.message_id);
    switch (true) {
      // @ts-ignore
      case media.video !== undefined:
        if (media.video.file_size > 20971000) {
          toCopy.push(media.message_id);
        } else {
          group.push({
            type: 'video',
            caption: media.caption ?? '',
            media: {
              url: Input.fromURL(await Bot.telegram.getFileLink(media.video.file_id)),
            },
          });
        }

        break;
      // @ts-ignore
      case media.photo !== undefined:
        if (media.photo[media.photo.length - 1].file_size > 5242000) {
          toCopy.push(media.message_id);
        } else {
          group.push({
            type: 'photo',
            caption: media.caption ?? '',
            media: {
              url: Input.fromURL(await Bot.telegram.getFileLink(media.photo[media.photo.length - 1].file_id)),
            },
          });
        }

        break;
      default:
        break;
    }
  }

  if (group.length !== 0) {
  // @ts-ignore
    Bot.telegram.sendMediaGroup(constants.TG_CHANNEL_ID, group).then(async () => {
      const response = await ctx.reply(constants.replies.getRandomMediaGroupText());
      pushToDelete(response.chat.id, response.message_id);
      ctx.deleteMessages(messages);
    });
  }

  if (toCopy.length !== 0 && 'message' in ctx.update) {
    Bot.telegram.copyMessages(constants.TG_CHANNEL_ID, ctx.update.message.from.id, toCopy).then(async () => {
      const response = await ctx.reply('Какие толстенькие видосики у нас в группе, ух, отправил их отдельно');
      pushToDelete(response.chat.id, response.message_id);
      ctx.deleteMessages(messages);
    });
  }
});

composer.on(message('photo'), async (ctx) => {
  Bot.telegram.copyMessage(constants.TG_CHANNEL_ID, ctx.update.message.chat.id, ctx.update.message.message_id).then(async () => {
    ctx.deleteMessage();
    const response = await ctx.reply(constants.replies.getRandomPhotoText());
    pushToDelete(response.chat.id, response.message_id);
  });
});

composer.on(message('video'), async (ctx) => {
  Bot.telegram.copyMessage(constants.TG_CHANNEL_ID, ctx.update.message.chat.id, ctx.update.message.message_id).then(async () => {
    ctx.deleteMessage();
    const response = await ctx.reply(constants.replies.getRandomVideoText());
    pushToDelete(response.chat.id, response.message_id);
  });
});

composer.on(message('audio'), async (ctx) => {
  Bot.telegram.copyMessage(constants.TG_CHANNEL_ID, ctx.update.message.chat.id, ctx.update.message.message_id).then(async () => {
    ctx.deleteMessage();
    const response = await ctx.reply(constants.replies.getRandomAudioText());
    pushToDelete(response.chat.id, response.message_id);
  });
});

composer.on(message('document'), async (ctx) => {
  Bot.telegram.copyMessage(constants.TG_CHANNEL_ID, ctx.update.message.chat.id, ctx.update.message.message_id).then(async () => {
    ctx.deleteMessage();
    const response = await ctx.reply(constants.replies.getRandomDocumentText());
    pushToDelete(response.chat.id, response.message_id);
  });
});

composer.on(message('text'), async (ctx) => {
  if (ctx.message.text === '/start') {
    ctx.deleteMessage();
    ctx.reply('Привет братишка, чем могу?');
    return;
  }
  Bot.telegram.sendMessage(constants.TG_CHANNEL_ID, ctx.update.message.text).then(async () => {
    ctx.deleteMessage();
    const response = await ctx.reply(constants.replies.getRandomText());
    pushToDelete(response.chat.id, response.message_id);
  });
});

Bot.use(async (ctx, next) => {
  apiLimit += 1;

  if (apiLimit >= 50) {
    const response = await ctx.reply('Ботик устал и ему нужно передохнуть, подожди пожалуйста');
    pushToDelete(response.chat.id, response.message_id);
  } else {
    return next();
  }

  return false;
});
Bot.use(composer.middleware());

export default Bot;
