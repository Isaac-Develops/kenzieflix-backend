const express = require("express")
const { nanoid } = require("nanoid")
const mongoose = require("mongoose")
const app = express()
const port = 3000

app.use(express.json())
app.use((req, res, next) => {
  res.header({ "Access-Control-Allow-Origin": "*" })
  res.header({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  })
  res.header({
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
  if (req.method == "OPTIONS") {
    res.sendStatus(200)
  }
  next()
})

const uri =
  "mongodb+srv://admin:G3brJuFg6uRrT1KS@kenzie-flix.dtkr9.mongodb.net/KenzieFlix?retryWrites=true&w=majority"

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

const User = mongoose.model("User", {
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profiles: {
    type: Array,
    default: [],
  },
})

app.get("/", (req, res) => {
  res.send("Hello World!")
})

// Get a list of users
app.get("/users", async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

// Create a new user
app.post("/users", (req, res) => {
  if (req.body.username || req.body.password) {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
    })
    newUser
      .save()
      .then(() => res.json(newUser))
      .catch((err) => res.status(400).send(err))
  }
})

// Get a single user
app.get("/users/:id", async (req, res) => {
  const id = req.params.id
  const selectedUser = await User.findById(id).exec()

  res.json(selectedUser)
})

// Update a user's info
app.patch("/users/:id", (req, res) => {
  const userIndex = db.findIndex((user) => user.id === req.params.id)

  if (userIndex !== -1) {
    if (req.body.password === undefined && req.body.username === undefined) {
      res.sendStatus(400)
    } else {
      let password =
        req.body.password !== undefined
          ? req.body.password
          : db[userIndex].password

      let username =
        req.body.username !== undefined
          ? req.body.username
          : db[userIndex].username

      db[userIndex].password = password
      db[userIndex].username = username
      res.json(db[userIndex])
      res.sendStatus(200)
    }
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

// Get a profile from the current user
app.get("/profiles/:id", (req, res) => {
  if (req.body.profileId) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (userIndex !== -1) {
      const profileIndex = db[userIndex].profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )
      if (profileIndex !== -1) {
        res.json(db[userIndex].profiles[profileIndex])
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

// Create a new profile
app.post("/profiles/:id", (req, res) => {
  if (req.body.name) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (userIndex !== -1) {
      const newProfile = {
        id: nanoid(),
        name: req.body.name,
      }
      db[userIndex].profiles.push(newProfile)
      res.json(db[userIndex])
      res.sendStatus(200)
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(400)
  }
})

// Update a profile's info
app.patch("/profiles/:id", (req, res) => {
  if (req.body.name && req.body.profileId) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)

    if (userIndex !== -1) {
      const profileIndex = db[userIndex].profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )

      if (profileIndex !== -1) {
        db[userIndex].profiles[profileIndex].name = req.body.name
        res.json(db[userIndex].profiles[profileIndex])
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

// Remove a profile
app.delete("/profiles/:id", (req, res) => {
  if (req.body.profileId) {
    const userIndex = db.findIndex((user) => user.id === req.params.id)
    if (userIndex !== -1) {
      if (
        db[userIndex].profiles.some((user) => user.id === req.body.profileId)
      ) {
        db[userIndex].profiles = db[userIndex].profiles.filter(
          (user) => user.id !== req.body.profileId
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
