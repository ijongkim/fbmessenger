const express = require('express')
const app = express()
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser')
const promise = require('bluebird')
const options = { promiseLib: promise }
const pgp = require('pg-promise')(options)
module.exports = pgp(process.env.DB_URL)
const db = require('./db.js')
const utils = require('./utils.js')

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
  let message = event.message
  let messageText = message.text.split(' ')
  if (messageText[0] === '/list') {
    db.getList(senderID)
  } else if (messageText[0] === '/add') {
    let item = messageText.slice(1)
    item = item.join(' ')
    db.addItem(senderID, item)
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
        db.doneItem(senderID, id)
      } else {
        utils.sendResponse(data)
      }
    } else {
      utils.sendResponse(data)
    }
  } else if (messageText[0] === '/completed') {
    db.getCompleted(senderID)
  } else if (messageText[0] === '/help') {
    utils.displayHelp(senderID)
  } else {
    let data = {
      recipient: {
        id: senderID
      },
      message: {
        text: `Hello! For a list of available commands type '/help'\n`
      }
    }
    utils.sendResponse(data)
  }
}

app.listen(process.env.PORT, function () {
  console.log('Server running on 3000')
})
