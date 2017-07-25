const db = require('./index.js')
const utils = require('./utils.js')
const moment = require('moment')

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
      utils.sendResponse(data)
    } else {
      let items = ['Your list of TODO items:']
      results.forEach(function (item, id) {
        items.push(`#${id + 1} - ${item.item} (added ${moment(item.created_timestamp).fromNow()})`)
      })
      items = items.join('\n')
      data.message.text = items
      utils.sendResponse(data)
    }
  })
  .catch(error => {
    data.message.text = `Error diplaying your list: ${error.error}`
    utils.sendResponse(data)
  })
}

function getCompleted (recipient) {
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
      utils.sendResponse(data)
    } else {
      let items = ['Your list of completed TODO items:']
      results.forEach(function (item, id) {
        items.push(`${id + 1} - ${item.item} (completed ${moment(item.last_updated).fromNow()})`)
      })
      items = items.join('\n')
      data.message.text = items
      utils.sendResponse(data)
    }
  })
  .catch(error => {
    data.message.text = `Error diplaying your list: ${error.error}`
    utils.sendResponse(data)
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
    utils.sendResponse(data)
  })
  .catch(error => {
    data.message.text = `Error adding item to your list: ${error.error}`
    utils.sendResponse(data)
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
      utils.sendResponse(data)
    } else if (id > results.length) {
      data.message.text = 'Invalid item number'
      utils.sendResponse(data)
    } else {
      db.none(`UPDATE todo SET last_updated = now(), completed = 't' WHERE id = '${results[id].id}' AND user_id = '${recipient}' `)
      .then(results => {
        data.message.text = `Item #${id + 1} marked complete`
        utils.sendResponse(data)
      })
      .catch(error => {
        data.message.text = `Error marking item complete: ${error.error}`
        utils.sendResponse(data)
      })
    }
  })
  .catch(error => {
    console.log(error)
    data.message.text = `Error retriving completed tasks: ${error.error}`
    utils.sendResponse(data)
  })
}

function deleteItem (recipient, id) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: 'No items to delete'
    }
  }
  db.manyOrNone(`SELECT id, created_timestamp, item FROM todo WHERE user_id = '${recipient}' AND completed = 'f';`)
  .then(results => {
    if (results.length < 1) {
      utils.sendResponse(data)
    } else if (id > results.length) {
      data.message.text = 'Invalid item number'
      utils.sendResponse(data)
    } else {
      db.none(`DELETE FROM todo WHERE id = '${results[id].id}' AND user_id = '${recipient}' `)
      .then(results => {
        data.message.text = `Item #${id + 1} deleted`
        utils.sendResponse(data)
      })
      .catch(error => {
        data.message.text = `Error deleting item: ${error.error}`
        utils.sendResponse(data)
      })
    }
  })
  .catch(error => {
    console.log(error)
    data.message.text = `Error retriving current tasks: ${error.error}`
    utils.sendResponse(data)
  })
}

function updateItem (recipient, id, item) {
  let data = {
    recipient: {
      id: recipient
    },
    message: {
      text: 'No items to update'
    }
  }
  db.manyOrNone(`SELECT id, created_timestamp, item FROM todo WHERE user_id = '${recipient}' AND completed = 'f';`)
  .then(results => {
    if (results.length < 1) {
      utils.sendResponse(data)
    } else if (id > results.length) {
      data.message.text = 'Invalid item number'
      utils.sendResponse(data)
    } else {
      db.none(`UPDATE todo SET item = '${item}' WHERE id = '${results[id].id}' AND user_id = '${recipient}' `)
      .then(results => {
        data.message.text = `Item #${id + 1} updated with ${item}`
        utils.sendResponse(data)
      })
      .catch(error => {
        data.message.text = `Error updating item: ${error.error}`
        utils.sendResponse(data)
      })
    }
  })
  .catch(error => {
    console.log(error)
    data.message.text = `Error retriving current tasks: ${error.error}`
    utils.sendResponse(data)
  })
}

module.exports.getList = getList
module.exports.getCompleted = getCompleted
module.exports.addItem = addItem
module.exports.doneItem = doneItem
module.exports.deleteItem = deleteItem
module.exports.updateItem = updateItem
