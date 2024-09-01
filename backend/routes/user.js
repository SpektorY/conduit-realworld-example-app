const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const { fetchCurrentUser, updateUser } = require("../controllers/userController");

//* Current User
router.get("/", verifyToken, fetchCurrentUser);

//* Update User
router.put("/", verifyToken, updateUser);

module.exports = router;
