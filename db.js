const db = require('./index.js')
const sendResponse = require('./utils.js')

function getList (recipient) {
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

module.exports.getList = getList
