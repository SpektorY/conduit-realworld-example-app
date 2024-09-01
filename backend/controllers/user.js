const { User } = require("../models");
const { jwtSign } = require("../helper/jwt");
const { bcryptHash, bcryptCompare } = require("../helper/bcrypt");
const {
  ValidationError,
  FieldRequiredError,
  AlreadyTakenError,
  NotFoundError,
} = require("../helper/customErrors");

//* Register User
const registerUser = async (req, res, next) => {
  try {
    const { username, email, bio, image, password } = req.body.user;
    if (!username) throw new FieldRequiredError("A username");
    if (!email) throw new FieldRequiredError("An email");
    if (!password) throw new FieldRequiredError("A password");

    const userExists = await User.findOne({ where: { email } });
    if (userExists) throw new AlreadyTakenError("Email", "try logging in");

    const newUser = await User.create({
      email,
      username,
      bio,
      image,
      password: await bcryptHash(password),
    });

    newUser.dataValues.token = await jwtSign(newUser);

    res.status(201).json({ user: newUser });
  } catch (error) {
    next(error);
  }
};

//* Login User
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body.user;

    const existentUser = await User.findOne({ where: { email } });
    if (!existentUser) throw new NotFoundError("Email", "sign in first");

    const isPasswordCorrect = await bcryptCompare(password, existentUser.password);
    if (!isPasswordCorrect) throw new ValidationError("Wrong email/password combination");

    existentUser.dataValues.token = await jwtSign(existentUser);

    res.json({ user: existentUser });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
