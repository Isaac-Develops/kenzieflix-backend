const express = require("express")
const { nanoid } = require("nanoid")
const app = express()
const port = 3000

app.use(express.json())

let db = []

app.get("/", (req, res) => {
  res.send("Hello World!")
})

// Get a list of users
app.get("/users", (req, res) => {
  res.json(db)
  res.sendStatus(200)
})

// Create a new user
app.post("/users", (req, res) => {
  if (req.body.username || req.body.password) {
    const newUser = {
      id: nanoid(),
      username: req.body.username,
      password: req.body.password,
      subUsers: [],
    }
    db.push(newUser)
    res.json(newUser)
    res.sendStatus(200)
  } else {
    res.sendStatus(400)
  }
})

// Get a single user
app.get("/users/:id", (req, res) => {
  const selectedUser = db.find((user) => user.id === req.params.id)

  if (selectedUser !== undefined) {
    res.json(selectedUser)
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

// Delete a single user
app.delete("/users/:id", (req, res) => {
  if (db.some((user) => user.id === req.params.id)) {
    db = db.filter((user) => user.id !== req.params.id)
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

// Get a sub user from the current user
app.get("/subUsers/:id", (req, res) => {
  if (req.body.subUserId) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (userIndex !== -1) {
      const subUserIndex = db[userIndex].subUsers.findIndex(
        (user) => user.id === req.body.subUserId
      )
      if (subUserIndex !== -1) {
        res.json(db[userIndex].subUsers[subUserIndex])
        res.sendStatus(200)
      } else {
        res.sendStatus(404)
      }
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(400)
  }
})

// Create a new sub user
app.post("/subUsers/:id", (req, res) => {
  if (req.body.name) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (db.some((user) => user.id === req.params.id)) {
      const newSubUser = {
        id: nanoid(),
        name: req.body.name,
      }
      db[userIndex].subUsers.push(newSubUser)
      res.json(db[userIndex])
      res.sendStatus(200)
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(400)
  }
})

// Remove a sub user
app.delete("/subUsers/:id", (req, res) => {
  if (req.body.subUserId) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (userIndex !== -1) {
      if (
        db[userIndex].subUsers.some((user) => user.id === req.body.subUserId)
      ) {
        db[userIndex].subUsers = db[userIndex].subUsers.filter(
          (user) => user.id !== req.body.subUserId
        )
        res.sendStatus(200)
      } else {
        res.sendStatus(404)
      }
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(400)
  }
})

// Not Found Page
app.get("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
