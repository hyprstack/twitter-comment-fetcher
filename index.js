#!/usr/bin/env node
/**
 * Created by mario (https://github.com/hyprstack) on 01/10/2019.
 */
const Twitter = require('twitter');
const {isNil} = require('lodash');
const url = require('url');
const querystring = require('querystring');
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
      include_entities: true,
      result_type: 'recent'
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

async function getComment(options) {
  try {
    const {
      twitterClient,
      originalTweet,
      tweetId,
      twitterHandler,
      numberOfComments,
      next_results,
      comments,
      attemptNumber
    } = options;

    let params;
    let attempt = attemptNumber;

    if (!next_results) {
      params = {
        q: `to:${twitterHandler}`,
        since_id: tweetId,
        count: numberOfComments,
        result_type: 'mixed'
      };
    } else {
      const {query} = url.parse(next_results);
      params = querystring.parse(query);
    }

    const results = await twitterClient.get(`search/tweets.json`, params);

    const {
      statuses,
      search_metadata: {
        next_results: nextQr
      }
    } = results;

    const commentsOfTweet = statuses.filter((comment) => comment.in_reply_to_status_id_str === tweetId);
    const addedComments = comments.concat(commentsOfTweet.map(comment => comment.text));

    if (!commentsOfTweet.length) {
      attempt += 1
    }

    if (nextQr && attempt < 10) {
      const nextOptions = {
        twitterClient,
        comments: addedComments,
        originalTweet,
        tweetId,
        twitterHandler,
        numberOfComments,
        next_results: nextQr,
        attemptNumber: attempt
      };
      return await getComment(nextOptions)
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
    const promiseList = tweets.map(({id, originalTweet}) => getComment({twitterClient, originalTweet, tweetId:id, twitterHandler, numberOfComments, comments: [], attemptNumber: 0}))
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
    const numberOfTweets = process.argv[3] < 3 ? process.argv[3] : 2;
    const numberOfComments = process.argv[4] <= 100 ? process.argv[4] : 50;

    const tweets = await getTweets(twitterClient, twitterHandler, numberOfTweets);
    const tweetAndComments = await runGetComments(twitterClient, tweets, twitterHandler, numberOfComments);
    console.log(JSON.stringify(tweetAndComments, null, 2));
  } catch (err) {
    console.log('err', err);
    process.exit(1);
  }
}

run();
