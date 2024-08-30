import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import { students } from "./model/userDetails.js";

env.config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB Atlas");
}).catch((err) => {
  console.error("Error connecting to MongoDB Atlas:", err);
});

const app = express();
const port = process.env.PORT || 3000; // default port if not provided in .env
const saltRound = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/userDetails", (req, res) => {
  const data = req.user;
  console.log(data);
  if (req.isAuthenticated()) {
    res.render("studentDetails.ejs", { data });
  } else {
    res.redirect("/login");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/userDetails",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const { name, username: email, password, course, dept_name: dept, univ_col_name } = req.body;

  try {
    const userEmail = await students.findOne({ email });
    if (userEmail) {
      res.send("Email already exists");
    } else {
      bcrypt.hash(password, saltRound, async (err, hashedPassword) => {
        if (err) {
          console.log(err);
        } else {
          const userData = new students({
            name,
            email,
            password: hashedPassword,
            course,
            dept_name: dept,
            univ_col_name,
          });
          await userData.save();
          console.log(userData.email, userData.password);

          res.redirect("/login");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const userData = await students.findOne({ email: username });
      if (userData) {
        const storedPassword = userData.password;
        bcrypt.compare(password, storedPassword, (err, isPasswordValid) => {
          if (err) {
            return cb(err);
          } else if (isPasswordValid) {
            return cb(null, userData);
          } else {
            return cb(null, false);
          }
        });
      } else {
        return cb(null, false);
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
