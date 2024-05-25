import './bots/telegram';

process.on('uncaughtException', (err) => {
  console.log('Caught exception: ', err);
});
