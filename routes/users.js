//modules
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/database");

//image upload code starts here

const upload = require("./multer");

const singleUpload = upload.single("image");

router.post("/userimage/:id", (req, res) => {
  var id = req.params.id;

  singleUpload(req, res, (err, some) => {
    if (err) {
      return res.json({
        msg: "Image Upload Error",
        detail: err.message
      });
    } else {
      User.updateOne(
        { user_id: id },
        { $set: { image: req.file.location } },
        (err, user) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, msg: "Failed to upload photo" });
          } else {
            console.log("user changed");

            return res.json({
              success: true,
              msg: "Details updated:" + req.file.location
            });
          }
        }
      );
    }
  });
});

//image upload code ends here

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, "./images/userprofile");
//   },
//   filename: function(req, file, cb) {
//     cb(null, file.originalname);
//   }
// });
//const uploadUserImage = multer({ storage: upload });

//register
router.post("/register", (req, res) => {
  const url = req.protocol + "://" + req.get("host");
  User.countDocuments((err, count) => {
    let newUser = new User({
      user_id: count + 1,
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      college: req.body.college,
      username: req.body.username,
      password: req.body.password,
      type: req.body.type,
      image: url + "/images/userprofile/default.png"
    });
    User.addUser(newUser, (err, user) => {
      if (err) {
        console.log(err);

        res.json({ success: false, msg: "failed to register user" });
      } else {
        res.json({ success: true, msg: "user registered" });
      }
    });
  });
});

//authenticate
router.post("/authenticate", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.getUserByUsername(username, (err, user) => {
    if (err) {
      console.log(err);

      return res.json({ success: false, msg: "Something went wrong" });
    }
    if (!user) {
      return res.json({ success: false, msg: "user not found" });
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) {
        throw err;
      }
      if (isMatch) {
        const user1 = { user: user };

        const token = jwt.sign(user1, config.secret, {
          expiresIn: 604800 // 1 week
        });

        res.json({
          success: true,
          token: "JWT " + token,
          user: {
            user_id: user.user_id,
            name: user.name,
            username: user.username,
            email: user.email,
            type: user.type
          }
        });
      } else {
        res.json({ success: false, msg: "wrong password" });
      }
    });
  });
});

//upload user image

// router.post("/userimage", uploadUserImage.single("image"), (req, res) => {
//   // res.json({ message: "worked" });
//   console.log(req.file);
//   return res.json({ imageUrl: req.file.req.file.location });
// });

//update
router.put("/editprofile", (req, res) => {
  let newUser = {
    user_id: req.body.user_id,
    name: req.body.name,
    email: req.body.email,
    contact: req.body.contact,
    college: req.body.college
  };
  console.log(newUser);

  User.update({ user_id: req.body.user_id }, { $set: newUser }, (err, user) => {
    if (err) {
      console.log(err);

      res.json({ success: false, msg: "Failed to update user" });
    } else {
      res.json({ success: true, msg: "Details updated" });
    }
  });
});

//profile
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;
