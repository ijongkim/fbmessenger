const express = require('express')
const app = express()
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser')

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
      let pageID = entry.id
      let timeOfEvent = entry.time
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else {
          console.log('Webhook received unknown event:', event)
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
    displayList(event)
  } else if (messageText[0] === '/add') {
    addItem(event)
  } else if (messageText[0] === '/done') {
    doneItem(event)
  } else if (messageText[0] === '/completed') {
    displayCompleted(event)
  } else {
    displayHelp(event)
  }
}

function displayHelp (event) {
  console.log('You can use these commands')
}

function displayList (event) {
  console.log('Here\'s your list')
}

function displayCompleted (event) {
  console.log('Completed list')
}

function addItem (event) {
  console.log('Adding')
}

function doneItem (event) {
  console.log('Done')
}

app.listen(process.env.PORT, function () {
  console.log('Server running on 3000')
})
