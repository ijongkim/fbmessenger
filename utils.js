const request = require('request')

function displayHelp (recipient) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: `Here's your available commands:\n/help - Displays this list of commands\n/list - Displays your remaining tasks\n/add - Adds item to TODO list (ex: /add buy milk)\n/done - Marks an item complete by item number (ex: /done #1)\n/update - Updates item to TODO list (ex: /update #1 buy juice)\n/delete - Deletes item from TODO list (ex: /delete #1)\n/completed - Displays your completed tasks`
    }
  }
  sendResponse(data)
}

function sendResponse (messageData) {
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

module.exports.displayHelp = displayHelp
module.exports.sendResponse = sendResponse