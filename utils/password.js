const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateRandomPassword = (length = 8) =>
{
    return crypto.randomBytes(length).toString("base64")
    .slice(0,length);
}

const hashPassword = async (plainPassword) =>
{
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword,salt)
}

module.exports = {
    generateRandomPassword,
    hashPassword
}