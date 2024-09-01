const {
  NotFoundError,
  UnauthorizedError,
  FieldRequiredError,
  ForbiddenError,
} = require("../helper/customErrors");
const { appendFollowers } = require("../helper/helpers");
const { Article, Comment, User } = require("../models");

//* Fetch All Comments for an Article
const fetchComments = async (req, res, next) => {
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
      await appendFollowers(loggedUser, comment);
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

    comment.dataValues.author = loggedUser;
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

    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError("Comment");

    const article = await Article.findOne({ where: { slug } });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== comment.userId) {
      throw new ForbiddenError("comment");
    }

    await comment.destroy();

    res.json({ message: { body: ["Comment deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = { fetchComments, addComment, removeComment };
