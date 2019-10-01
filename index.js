#!/usr/bin/env node
/**
 * Created by mario (https://github.com/hyprstack) on 01/10/2019.
 */
const Twitter = require('twitter');
const {
  consumer_key,
  consumer_secret,
  access_token_key,
  access_token_secret
} = require('./configs.js');

async function run() {
  try {
    const twitterClient = new Twitter({
      consumer_key,
      consumer_secret,
      access_token_key,
      access_token_secret
    });
    const twitterHandler = process.argv[2];
    const numberOfTweets = process.argv[3];
    const numberOfComments = process.argv[4];

    const params = {
      q: `screen_name=${twitterHandler}`,
      count: numberOfTweets
    };

    const tweets = await twitterClient.get(`statuses/user_timeline`, params);
    console.log(JSON.stringify(tweets, null, 2));
  } catch (err) {
    console.log('err', err);
  }
}

run();
