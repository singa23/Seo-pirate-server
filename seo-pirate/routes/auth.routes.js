const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

const Website = require("../models/Website.model");

const scraper = require("seo-scraper");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

router.put("/user/:id", isAuthenticated, (req, res, next) => {
  const userId = req.params.id;
  const { username, password } = req.body;

  let updateData = { username };

  if (password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    updateData.password = hashedPassword;
  }

  User.findByIdAndUpdate(userId, updateData, { new: true })
    .then((updatedUser) => {
      const { _id, email, username } = updatedUser;
      const payload = { _id, email, username };
      const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "6h",
      });
      res.status(200).json({ user: updatedUser, authToken: authToken });
    })
    .catch((error) => {
      next(error);
    });
});

// POST /auth/register  - Creates a new user in the database
router.post("/register", (req, res, next) => {
  const { email, password, username } = req.body;

  // Check if email or password or name are provided as empty strings
  if (email === "" || password === "" || username === "") {
    res.status(400).json({ message: "Provide email, password and username" });
    return;
  }

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks password for special characters and minimum length
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  // Check the users collection if a user with the same email already exists
  User.findOne({ email })
    .then((foundUser) => {
      // If the user with the same email already exists, send an error response
      if (foundUser) {
        res.status(400).json({ message: "User already exists." });
        return;
      }

      // If email is unique, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create the new user in the database
      // We return a pending promise, which allows us to chain another `then`
      return User.create({
        email,
        password: hashedPassword,
        username,
      });
    })
    .then((createdUser) => {
      // Deconstruct the newly created user object to omit the password
      const { email, username, _id } = createdUser;

      // Create a new object that doesn't expose the password
      const user = { email, username, _id };

      // Send a json response containing the user object
      res.status(201).json({ user: user });
    })

    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// POST  /api/login - Verifies email and password and returns a JWT
router.post("/login", (req, res, next) => {
  const { username, password } = req.body;

  // Check if username or password are provided as empty string
  if (username === "" || password === "") {
    res.status(400).json({ message: "Provide username and password." });
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ username })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found." });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, username } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, username };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

router.get("/homepage", isAuthenticated, (req, res, next) => {
  res.status(200).json({ message: "Welcome to the homepage!" });
});

router.post("/websites", isAuthenticated, async (req, res, next) => {
  const { name, url, userId } = req.body;

  try {
    const seodatas = await scraper.scrape({ url });

    const newWebsite = await Website.create({ name, url, userId, seodatas });

    res.status(201).json(newWebsite);
  } catch (error) {
    next(error);
  }
});
router.get("/websites", isAuthenticated, (req, res, next) => {
  const userId = req.payload._id;

  Website.find({ userId: userId })
    .then((websites) => {
      res.status(200).json(websites);
    })
    .catch((error) => {
      next(error);
    });
});

router.get("/websites/:id", isAuthenticated, (req, res, next) => {
  const { id } = req.params;

  Website.findById(id)
    .then(async (foundWebsite) => {
      const elements = await scraper.scrape({ url: foundWebsite.url });

      foundWebsite.seodatas = elements;

      foundWebsite
        .save()
        .then((updatedWebsite) => {
          res.status(200).json(updatedWebsite);
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
});

router.put("/websites/:id", isAuthenticated, (req, res, next) => {
  const { id } = req.params;
  const { name, url, seodatas } = req.body;

  Website.findByIdAndUpdate(id, { name, url, seodatas }, { new: true })
    .then((updatedWebsite) => {
      res.status(200).json(updatedWebsite);
    })
    .catch((error) => {
      next(error);
    });
});

router.delete("/websites/:id", isAuthenticated, (req, res, next) => {
  const { id } = req.params;

  Website.findByIdAndRemove(id)
    .then(() => {
      res.status(204).json();
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = router;
