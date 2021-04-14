const express = require("express")
const { nanoid } = require("nanoid")
const mongoose = require("mongoose")
const app = express()
const port = 3000

// Middleware
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

// Set up connection with database
const uri =
  "mongodb+srv://admin:G3brJuFg6uRrT1KS@kenzie-flix.dtkr9.mongodb.net/KenzieFlix?retryWrites=true&w=majority"

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })

// User model
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
  if (req.body.username && req.body.password) {
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
app.patch("/users/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.password === undefined && req.body.username === undefined) {
      res.sendStatus(400)
    } else {
      let password =
        req.body.password !== undefined
          ? req.body.password
          : selectedUser.password

      let username =
        req.body.username !== undefined
          ? req.body.username
          : selectedUser.username

      const updatedUser = User.findByIdAndUpdate(req.params.id, {
        username: username,
        password: password,
      })
      res.json(updatedUser)
    }
  } else {
    res.sendStatus(404)
  }
})

// Delete a single user
app.delete("/users/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
})

// Find a user by username and password
// TODO: Add tokens for authentication
app.post("auth/login", async (req, res) => {
  if (req.body.username && req.body.password) {
    const selectedUser = await User.find({
      username: req.body.username,
      password: req.body.password,
    }).exec()

    if (selectedUser !== null) {
      res.json(selectedUser)
    } else {
      res.status(404)
    }
  }
})

// Get a list of profiles or a single profile from the current user
app.get("/profiles/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId) {
      res.json(
        selectedUser.profiles.find(
          (profile) => profile.id === req.body.profileId
        )
      )
    } else {
      res.json(selectedUser.profiles)
    }
  } else {
    res.status(404)
  }
})

// Create a new profile
app.post("/profiles/:id", async (req, res) => {
  if (req.body.name && req.body.avatar) {
    const newProfile = {
      id: nanoid(),
      name: req.body.name,
      avatar: req.body.avatar,
    }

    const selectedUser = await User.findById(req.params.id).exec()

    if (selectedUser !== null) {
      await User.updateOne(
        { _id: req.params.id },
        {
          profiles: [...selectedUser.profiles, newProfile],
        }
      )

      res.json(newProfile)
    } else {
      res.status(404)
    }
  } else {
    res.status(400)
  }
})

// Update a profile's info
app.patch("/profiles/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId) {
      if (req.body.name || req.body.avatar) {
        const profileIndex = selectedUser.profiles.findIndex(
          (profile) => profile.id === req.body.profileId
        )

        const name = req.body.name
          ? req.body.name
          : selectedUser.profiles[profileIndex].name
        const avatar = req.body.avatar
          ? req.body.avatar
          : selectedUser.profiles[profileIndex].avatar

        selectedUser.profiles[profileIndex].name = name
        selectedUser.profiles[profileIndex].avatar = avatar

        await User.replaceOne({ _id: req.params.id }, selectedUser)
        res.json(selectedUser)
      } else {
        res.status(400)
      }
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Remove a profile
app.delete("/profiles/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId) {
      selectedUser.profiles = selectedUser.profiles.filter(
        (profile) => profile.id !== req.body.profileId
      )

      await User.replaceOne({ _id: req.params.id }, selectedUser)
      res.json(selectedUser)
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Not Found Page
app.get("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
