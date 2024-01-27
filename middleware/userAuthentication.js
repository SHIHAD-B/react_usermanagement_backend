const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) throw new Error("not logined");
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        next();
    } catch (error) {
        console.log(error.message);
        res.status(401).send(error.message)
    }
};

module.exports = auth;

