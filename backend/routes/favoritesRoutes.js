const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyToken = require("../../middleware/authentication");
const { toggleFavorite } = require("../../controllers/favoriteController");

//* Favorite Article
router.post("/favorite", verifyToken, toggleFavorite);

//* Unfavorite Article
router.delete("/favorite", verifyToken, toggleFavorite);

module.exports = router;
