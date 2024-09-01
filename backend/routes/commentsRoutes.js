const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyToken = require("../../middleware/authentication");
const { fetchComments, addComment, removeComment } = require("../../controllers/commentController");

//? Fetch Comments
router.get("/comments", fetchComments);

//* Add Comment
router.post("/comments", verifyToken, addComment);

//* Remove Comment
router.delete("/comments/:commentId", verifyToken, removeComment);

module.exports = router;
