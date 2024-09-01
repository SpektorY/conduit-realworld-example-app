const {
  AlreadyTakenError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} = require("../helper/customErrors");
const {
  appendFollowers,
  appendFavorites,
  appendTagList,
  slugify,
} = require("../helper/helpers");
const { Article, Tag, User } = require("../models");

const includeOptions = [
  { model: Tag, as: "tagList", attributes: ["name"] },
  { model: User, as: "author", attributes: { exclude: ["email"] } },
];

//* Utility function to process an article for response
const processArticleForResponse = async (article, loggedUser) => {
  const articleTags = await article.getTagList();
  appendTagList(articleTags, article);
  await appendFollowers(loggedUser, article);
  await appendFavorites(loggedUser, article);
  delete article.dataValues.Favorites;
};

//* All Articles - by Author/by Tag/Favorited by user
const allArticles = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    const { author, tag, favorited, limit = 3, offset = 0 } = req.query;

    const searchOptions = {
      include: [
        {
          model: Tag,
          as: "tagList",
          attributes: ["name"],
          ...(tag && { where: { name: tag } }),
        },
        {
          model: User,
          as: "author",
          attributes: { exclude: ["email"] },
          ...(author && { where: { username: author } }),
        },
      ],
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
    };

    let articles = { rows: [], count: 0 };

    if (favorited) {
      const user = await User.findOne({ where: { username: favorited } });
      if (user) {
        articles.rows = await user.getFavorites(searchOptions);
        articles.count = await user.countFavorites();
      }
    } else {
      articles = await Article.findAndCountAll(searchOptions);
    }

    await Promise.all(articles.rows.map((article) => processArticleForResponse(article, loggedUser)));

    res.json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

//* Create Article
const createArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { title, description, body, tagList } = req.body.article;
    if (!title) throw new FieldRequiredError("A title");
    if (!description) throw new FieldRequiredError("A description");
    if (!body) throw new FieldRequiredError("An article body");

    const slug = slugify(title);
    const slugInDB = await Article.findOne({ where: { slug } });
    if (slugInDB) throw new AlreadyTakenError("Title");

    const article = await Article.create({
      slug,
      title,
      description,
      body,
    });

    for (const tag of tagList) {
      const tagName = tag.trim();
      if (tagName.length > 2) {
        const [tagInDB] = await Tag.findOrCreate({ where: { name: tagName } });
        await article.addTagList(tagInDB);
      }
    }

    article.setAuthor(loggedUser);
    await processArticleForResponse(article, loggedUser);

    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
};

//* Feed
const articlesFeed = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { limit = 3, offset = 0 } = req.query;
    const authors = await loggedUser.getFollowing();

    const articles = await Article.findAndCountAll({
      include: includeOptions,
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
      where: { userId: authors.map((author) => author.id) },
    });

    await Promise.all(articles.rows.map((article) => processArticleForResponse(article, loggedUser)));

    res.json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

//* Single Article by slug
const singleArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    const { slug } = req.params;

    const article = await Article.findOne({
      where: { slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    await processArticleForResponse(article, loggedUser);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Update Article
const updateArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    const { title, description, body } = req.body.article;
    if (title) {
      article.slug = slugify(title);
      article.title = title;
    }
    if (description) article.description = description;
    if (body) article.body = body;
    await article.save();

    await processArticleForResponse(article, loggedUser);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Delete Article
const deleteArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    await article.destroy();

    res.json({ message: { body: ["Article deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  allArticles,
  createArticle,
  singleArticle,
  updateArticle,
  deleteArticle,
  articlesFeed,
};
