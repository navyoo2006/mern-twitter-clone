import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId },  process.env.JWT_SECRET, {
        expiresIn: '15d',
    })

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, //15 days in milliseconds
        httpOnly: true, //prevents xss/cross side scripting attacks
        sameSite: "strict", //CSRF attack prevention, only send cookie in requests from the same site
        secure: process.env.NODE_ENV === "production",
    })

}