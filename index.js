const express = require('express')
const app = express()
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser')
const moment = require('moment')
const request = require('request')
const promise = require('bluebird')
const options = { promiseLib: promise }
const pgp = require('pg-promise')(options)
let db = pgp(process.env.DB_URL)

app.use(bodyParser.json())

app.get('/fbmessenger', function (req, res) {
  let request = {
    mode: req.query['hub.mode'],
    challenge: req.query['hub.challenge'],
    verify_token: req.query['hub.verify_token']
  }
  if (request.mode === 'subscribe' && request.verify_token === process.env.VERIFY_TOKEN) {
    console.log('Verifying Token')
    res.status(200).send(request.challenge)
  } else {
    console.error('Failed validation. Make sure the validation tokens match.')
    res.sendStatus(403)
  }
})

app.post('/fbmessenger', function (req, res) {
  let data = req.body
  if (data.object === 'page') {
    data.entry.forEach(function (entry) {
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else {
          // console.log('Webhook received unknown event:', event)
        }
      })
    })
    res.sendStatus(200)
  }
})

function receivedMessage (event) {
  console.log('Message Received')
  let senderID = event.sender.id
  let recipientID = event.recipient.id
  let messageTime = event.timestamp
  let message = event.message
  let messageID = message.mid
  let messageText = message.text.split(' ')
  let messageAttachments = message.attachments
  if (messageText[0] === '/list') {
    displayList(senderID)
  } else if (messageText[0] === '/add') {
    let item = messageText.slice(1)
    item = item.join(' ')
    addItem(senderID, item)
  } else if (messageText[0] === '/done') {
    let data = {
      recipient: {
        id: senderID
      },
      message: {
        text: 'Invalid item number'
      }
    }
    if (messageText[1]) {
      let id = messageText[1].replace(/#/g, '')
      id = id.replace(/[^0-9]/g, '')
      if (id.length > 0) {
        id = parseInt(id)
        id--
        doneItem(senderID, id)
      } else {
        sendResponse(data)
      }
    } else {
      sendResponse(data)
    }
  } else if (messageText[0] === '/completed') {
    displayCompleted(senderID)
  } else if (messageText[0] === '/help') {
    displayHelp(senderID)
  } else {
    let data = {
      recipient: {
        id: senderID
      },
      message: {
        text: `Hello! For a list of available commands type '/help'\n`
      }
    }
    sendResponse(data)
  }
}

function displayHelp (recipient) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: `Here's your available commands:\n/help - Displays this list of commands\n/list - Displays your remaining tasks\n/add - Adds item to TODO list (ex: /add Buy Milk)\n/done - Marks an item complete by item number (ex: /done #1)\n/completed - Displays your completed tasks`
    }
  }
  sendResponse(data)
}

function displayList (recipient) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: 'Your list is empty'
    }
  }
  db.manyOrNone(`SELECT created_timestamp, item FROM todo WHERE user_id = '${recipient}' AND completed = 'f';`)
  .then(results => {
    if (results.length < 1) {
      sendResponse(data)
    } else {
      let items = ['Your list of TODO items:']
      results.forEach(function (item, id) {
        items.push(`#${id + 1} - ${item.item} (added on ${moment(item.created_timestamp).fromNow()})`)
      })
      items = items.join('\n')
      data.message.text = items
      sendResponse(data)
    }
  })
  .catch(error => {
    data.message.text = `Error diplaying your list: ${error.error}`
    sendResponse(data)
  })
}

function displayCompleted (recipient) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: 'Your completed list is empty'
    }
  }
  db.manyOrNone(`SELECT last_updated, item FROM todo WHERE user_id = '${recipient}' AND completed = 't';`)
  .then(results => {
    if (results.length < 1) {
      sendResponse(data)
    } else {
      let items = ['Your list of completed TODO items:']
      results.forEach(function (item, id) {
        items.push(`${id + 1} - ${item.item} (completed on ${moment(item.last_updated).fromNow()})`)
      })
      items = items.join('\n')
      data.message.text = items
      sendResponse(data)
    }
  })
  .catch(error => {
    data.message.text = `Error diplaying your list: ${error.error}`
    sendResponse(data)
  })
}

function addItem (recipient, item) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: ''
    }
  }
  db.oneOrNone(`INSERT INTO todo (user_id, item) VALUES (${recipient}, '${item}');`)
  .then(results => {
    data.message.text = `Added "${item}" to your list.`
    sendResponse(data)
  })
  .catch(error => {
    data.message.text = `Error adding item to your list: ${error.error}`
    sendResponse(data)
  })
}

function doneItem (recipient, id) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: 'No items to mark completed'
    }
  }
  db.manyOrNone(`SELECT id, created_timestamp, item FROM todo WHERE user_id = '${recipient}' AND completed = 'f';`)
  .then(results => {
    if (results.length < 1) {
      sendResponse(data)
    } else if (id > results.length) {
      data.message.text = 'Invalid item number'
      sendResponse(data)
    } else {
      db.none(`UPDATE todo SET last_updated = now(), completed = 't' WHERE id = '${results[id].id}' AND user_id = '${recipient}' `)
      .then(results => {
        data.message.text = `Item #${id + 1} marked complete`
        sendResponse(data)
      })
      .catch(error => {
        data.message.text = `Error marking item complete: ${error.error}`
        sendResponse(data)
      })
    }
  })
  .catch(error => {
    console.log(error)
    data.message.text = `Error retriving completed tasks: ${error.error}`
    sendResponse(data)
  })
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

app.listen(process.env.PORT, function () {
  console.log('Server running on 3000')
})
