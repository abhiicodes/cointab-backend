const express = require("express");
const User = require("../models/user.model");
const Blocked_user = require("../models/blocked.model");
const authMiddleware = require("../middlewares/auth.middleware");
const jwt = require("jsonwebtoken");
const router = express.Router();
const argon2 = require("argon2");
require("dotenv").config();

router.get("",authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select([
      "-password",
      "-createdAt",
      "-updatedAt",
    ]);
    res.send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/signup", async (req, res) => {
  try {
    let { email, password, user_name } = req.body;

    password = await argon2.hash(password);
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(401).send("User already exits.Please Login");
    }
    const user = await User.create({ email, password, user_name });

    return res.send({
      message: "User created successfully",
      user_id: user._id,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      return res.status(500).send("User does not exist or incorrect email");
    }
    let user_id = user._id;
    const failed = await Blocked_user.findOne({ user_id }).lean().exec();

    if (failed) {
      if (failed.blocked_at != undefined) {
        let oldDate = Number(failed.blocked_at);
        let newDate = Date.now();
        let fromDate = parseInt(new Date(oldDate).getTime() / 1000);
        let toDate = parseInt(new Date(newDate).getTime() / 1000);
        let timeDiff = (toDate - fromDate) / 3600;

        if (timeDiff < 24) {
          timeDiff = Math.floor(24 - timeDiff);
          return res
            .status(500)
            .send(`Your account is blocked for ${timeDiff} hours`);
        }
      }
    }
    if (await argon2.verify(user.password, req.body.password)) {
      const token = jwt.sign(
        { email: user.email, _id: user._id },
        process.env.JWT_SECRET_KEY
      );

      const updated_failed = await Blocked_user.findOneAndDelete({ user_id });

      return res.send({ token });
    } else {
      if (failed && failed.count >= 4) {
        const updated_failed = await Blocked_user.findByIdAndUpdate(
          failed._id,

          { count: 5, blocked_at: Date.now() }
        );
        return res.status(500).send("Your account is blocked for 24 hours");
      } else {
        if (failed) {
          failed.count++;
          const updated_failed = await Blocked_user.findByIdAndUpdate(
            failed._id,
            { count: failed.count }
          );

          return res.status(500).send("Invalid email or password");
        } else {
          const updated_failed = await Blocked_user.create({
            user_id,
            count: 1,
          });

          return res.status(500).send("Invalid email or password");
        }
      }
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.post("/add",authMiddleware, async (req, res) => {
  try {
    let { email, password, user_name } = req.body;

    password = await argon2.hash(password);
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(401).send("User already exits.Please Login");
    }
    const user = await User.create({ email, password, user_name });

    return res.status(200).send({
      user,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

router.patch("/edit/:id",authMiddleware, async (req, res) => {
    console.log(req.body)
  try {
    let { password, user_name } = req.body;

    let needs_to_be_edited;
    if (user_name && password) {
      password = await argon2.hash(password);
      needs_to_be_edited = {
        user_name,
        password,
      };
    } else if (user_name) {
      needs_to_be_edited = {
        user_name,
      };
    } else {
      password = await argon2.hash(password);
      needs_to_be_edited = {
        password,
      };
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      needs_to_be_edited,{new:true}
    );

    return res.status(200).send({
      user,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});
router.delete("/delete/:id",authMiddleware, async (req, res) => {
  try {
 

    const user = await User.findByIdAndDelete(req.params.id);

    return res.status(200).send({
      user,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

module.exports = router;
