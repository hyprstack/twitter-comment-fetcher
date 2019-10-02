# twitter-comment-fetcher

Fetches comments given a twitter handler and the number of comments desired from most recent comments to oldest

In order to run this you will need a twitter api key.
To get one please follow ["twitter api key"](https://blog.rapidapi.com/how-to-use-the-twitter-api/#how-to-get-a-twitter-api-key)
You will need to register for a twitter developer account and then create an app.

To run `node index.js <handle> <# of comments>`

The config file should contain the following:
```javascript 1.8
const configs = {
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
};

module.exports = configs;
```
