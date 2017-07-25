const request = require('request')

module.exports = (messageData) => {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.PAGE_TOKEN
    },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error) {
      console.log('Response sent')
    } else {
      console.log('Unable to send message:', response.statusCode, error)
    }
  })
}
