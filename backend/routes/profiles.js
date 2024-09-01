const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const { fetchProfile, toggleFollow } = require("../controllers/profileController");

//? Profile
router.get("/:username", verifyToken, fetchProfile);

//* Follow Profile
router.post("/:username/follow", verifyToken, toggleFollow);

//* Unfollow Profile
router.delete("/:username/follow", verifyToken, toggleFollow);

module.exports = router;
