#!/usr/bin/env node
/**
 * Created by mario (https://github.com/hyprstack) on 01/10/2019.
 */
const Twitter = require('twitter');
const {isNil, fromPairs} = require('lodash');
const url = require('url');
const {
  consumer_key,
  consumer_secret,
  access_token_key,
  access_token_secret
} = require('./configs.js');

async function getTweets(twitterClient, twitterHandler, numberOfTweets) {
  try {
    const params = {
      q: `from:${twitterHandler}`,
      count: numberOfTweets,
      include_entities: true
    };

    const {statuses: tweets} = await twitterClient.get(`search/tweets.json`, params);
    return tweets.map(tweet => {
      const {retweeted_status, id_str} = tweet;
      const tweetId = !isNil(retweeted_status) ? retweeted_status.id_str : id_str;
      return {
        id: tweetId,
        originalTweet: tweet.text,
        isReTweet: !isNil(retweeted_status)
      }
    });
  } catch (e) {
    throw e;
  }
}

async function getComment(twitterClient, comments=[], originalTweet, tweetId, twitterHandler, numberOfComments, next_results) {
  try {
    let params;

    if (!next_results) {
      const now = new Date();
      params = {
        q: `to:${twitterHandler}`,
        since_id: tweetId,
        count: numberOfComments,
        until: now.toISOString().split('T')[0],
        result_type: 'mixed'
      };
    } else {
      const {query} = url.parse(next_results);
      // max_id=1178817724186841087&q=to%3AKTHopkins%20until%3A2019-10-01&count=100&include_entities=1&result_type=mixed
      const qParts = query
        .replace(/\=/gi, ':')
        .split('&')
        .map(e => e.split(':'))

      params = fromPairs(qParts);
    }

    console.log('Params', params);

    const results = await twitterClient.get(`search/tweets.json`, params);

    const {
      statuses,
      search_metadata: {
        next_results: nextQr
      }
    } = results;

    const commentsOfTweet = statuses.filter((comment) => comment.in_reply_to_status_id_str === tweetId);
    comments = comments.concat(commentsOfTweet.map(comment => comment.text));

    if (nextQr) {
      return getComment(twitterClient, comments, originalTweet, tweetId, twitterHandler, numberOfComments, nextQr)
    }

    return {
      tweetId,
      originalTweet,
      comments
    }
  } catch (e) {
    console.log(e);
    return Promise.resolve({});
  }
}

async function runGetComments(twitterClient, tweets, twitterHandler, numberOfComments) {
  try {
    const promiseList = tweets.map(({id, originalTweet}) => getComment(twitterClient, [], originalTweet, id, twitterHandler, numberOfComments))
    return await Promise.all(promiseList);
  } catch (e) {
    throw e;
  }
}

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

    const tweets = await getTweets(twitterClient, twitterHandler, numberOfTweets);
    console.log(tweets)
    const tweetAndComments = await runGetComments(twitterClient, tweets, twitterHandler, numberOfComments);
    console.log(JSON.stringify(tweetAndComments, null, 2));
  } catch (err) {
    console.log('err', err);
    process.exit(1);
  }
}

run();
