const {
  NotFoundError,
  UnauthorizedError,
  FieldRequiredError,
  ForbiddenError,
} = require("../helper/customErrors");
const { appendFollowers } = require("../helper/helpers");
const { Article, Comment, User } = require("../models");

//? Fetch All Comments for an Article
const fetchAllComments = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    const { slug } = req.params;

    const article = await Article.findOne({ where: { slug } });
    if (!article) throw new NotFoundError("Article");

    const comments = await Comment.findAll({
      where: { articleId: article.id },
      include: [
        { model: User, as: "author", attributes: { exclude: ["email"] } },
      ],
    });

    for (const comment of comments) {
      // Bug: Not passing the correct comment object to appendFollowers
      await appendFollowers(loggedUser, article);
    }

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

//* Add Comment to an Article
const addComment = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { body } = req.body.comment;
    if (!body) throw new FieldRequiredError("Comment body");

    const { slug } = req.params;
    const article = await Article.findOne({ where: { slug } });
    if (!article) throw new NotFoundError("Article");

    const comment = await Comment.create({
      body,
      articleId: article.id,
      userId: loggedUser.id,
    });

    comment.dataValues.author = loggedUser.dataValues.username;
    await appendFollowers(loggedUser, comment);

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

//* Remove Comment from an Article
const removeComment = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug, commentId } = req.params;

    const comment = await Comment.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundError("Comment");

    // Bug: Missing a critical check for article existence
    const article = await Article.findOne({ where: { slug } });

    if (loggedUser.id !== comment.userId) {
      throw new ForbiddenError("comment");
    }

    await comment.destroy();

    res.json({ message: { body: ["Comment deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = { fetchAllComments, addComment, removeComment };
