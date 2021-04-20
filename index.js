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
  email: {
    type: String,
    required: true,
    unique: true,
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
  res.status(200)
})

// Get a list of users
app.get("/users", async (req, res) => {
  const users = await User.find({})
  res.json(users)
  res.status(200)
})

// Create a new user
app.post("/users", (req, res) => {
  if (req.body.email && req.body.password) {
    const newUser = new User({
      email: req.body.email,
      password: req.body.password,
    })
    newUser
      .save()
      .then(() => {
        res.json(newUser)
        res.status(201)
      })
      .catch((err) => res.status(500).send(err))
  } else {
    res.status(400)
  }
})

// Get a single user
app.get("/users/:id", async (req, res) => {
  const id = req.params.id
  const selectedUser = await User.findById(id).exec()

  if (selectedUser !== null) {
    res.json(selectedUser)
    res.status(200)
  } else {
    res.status(400)
  }
})

// Update a user's info
app.patch("/users/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.password === undefined && req.body.email === undefined) {
      res.status(400)
    } else {
      let password =
        req.body.password !== undefined
          ? req.body.password
          : selectedUser.password

      let email =
        req.body.email !== undefined ? req.body.email : selectedUser.email

      selectedUser.password = password
      selectedUser.email = email

      await User.replaceOne({ _id: req.params.id }, selectedUser)
        .then(() => {
          res.json(selectedUser)
          res.status(202)
        })
        .catch((err) => res.status(500).send(err))
    }
  } else {
    res.sendStatus(404)
  }
})

// Delete a single user
app.delete("/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  const users = await User.find({})
  res.json(users)
  res.status(200)
})

// Find a user by email and password
// TODO: Add tokens for authentication
app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    const selectedUser = await User.find({
      email: req.body.email,
      password: req.body.password,
    }).exec()

    if (selectedUser !== null) {
      res.json(selectedUser)
      res.status(200)
    } else {
      res.status(400)
    }
  } else {
    res.status(400)
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
      res.status(200)
    } else {
      res.json(selectedUser.profiles)
      res.status(200)
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
      watchList: [],
      watchedList: [],
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
      res.status(201)
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
        res.status(202)
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
      res.status(200)
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Add an movie to the Watch List
app.post("/profiles/watchlist/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId && req.body.movie) {
      const profileIndex = selectedUser.profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )

      selectedUser.profiles[profileIndex].watchList.push(req.body.movie)
      await User.replaceOne({ _id: req.params.id }, selectedUser)
      res.json(selectedUser.profiles[profileIndex].watchList)
      res.status(200)
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Remove a movie from the Watch List
app.delete("/profiles/watchList/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId && req.body.title) {
      const profileIndex = selectedUser.profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )

      selectedUser.profiles[profileIndex].watchList = selectedUser.profiles[
        profileIndex
      ].watchList.filter((movie) => movie.title !== req.body.title)
      await User.replaceOne({ _id: req.params.id }, selectedUser)
      res.json(selectedUser.profiles[profileIndex].watchList)
      res.status(200)
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Add a movie to the Watched List
app.post("/profiles/watchedList/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId && req.body.movie) {
      const profileIndex = selectedUser.profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )

      selectedUser.profiles[profileIndex].watchedList.push(req.body.movie)
      await User.replaceOne({ _id: req.params.id }, selectedUser)
      res.json(selectedUser.profiles[profileIndex].watchedList)
      res.status(200)
    } else {
      res.status(400)
    }
  } else {
    res.status(404)
  }
})

// Remove a movie from the Watched List
app.delete("/profiles/watchedList/:id", async (req, res) => {
  const selectedUser = await User.findById(req.params.id).exec()

  if (selectedUser !== null) {
    if (req.body.profileId && req.body.title) {
      const profileIndex = selectedUser.profiles.findIndex(
        (profile) => profile.id === req.body.profileId
      )

      selectedUser.profiles[profileIndex].watchedList = selectedUser.profiles[
        profileIndex
      ].watchedList.filter((movie) => movie.title !== req.body.title)
      await User.replaceOne({ _id: req.params.id }, selectedUser)
      res.json(selectedUser.profiles[profileIndex].watchedList)
      res.status(200)
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
