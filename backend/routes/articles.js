const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const {
  fetchAllArticles,
  createArticle,
  fetchSingleArticle,
  updateArticle,
  deleteArticle,
  fetchArticlesFeed,
} = require("../controllers/articleController");

//? All Articles - by Author/by Tag/Favorited by user
router.get("/", verifyToken, fetchAllArticles);

//* Create Article
router.post("/", verifyToken, createArticle);

//* Feed
router.get("/feed", verifyToken, fetchArticlesFeed);

// Single Article by slug
router.get("/:slug", verifyToken, fetchSingleArticle);

//* Update Article
router.put("/:slug", verifyToken, updateArticle);

//* Delete Article
router.delete("/:slug", verifyToken, deleteArticle);

const favoritesRoutes = require("./articles/favoritesRoutes");
const commentsRoutes = require("./articles/commentsRoutes");

//> Favorites routes
router.use("/:slug", favoritesRoutes); // Scoped to article slug

//> Comments routes
router.use("/:slug", commentsRoutes); // Scoped to article slug

module.exports = router;
