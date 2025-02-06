const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateSignup = [
    check('email')
        .exists({ checkFalsy: true })
        .isEmail()
        .withMessage('Please provide a valid email.'),
    check('username')
        .exists({ checkFalsy: true })
        .isLength({ min: 4 })
        .withMessage('Please provide a username with at least 4 characters.'),
    check('username').not().isEmail().withMessage('Username cannot be an email.'),
    check('password')
        .exists({ checkFalsy: true })
        .isLength({ min: 6 })
        .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors,
];

// Sign up
router.post('/', validateSignup, async (req, res) => {
    const { email, password, username, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ 
            message: "First name, email, and last name are required"
        })
    }
    try {

        const existingEmail = await User.findOne(
            {
                where: {
                    email
                }
            }
        )
        if (existingEmail) {
            res.status(500).json({
                message: "Email is already in use"
            })
        }

        const existingUsername = await User.findOne(
            {
                where: {
                    username
                }
            }
        )
        if (existingUsername) {
            res.status(500).json({
                message: "Username is already in use"
            })
        }

        const hashedPassword = bcrypt.hashSync(password);
        const user = await User.create({ email, username, firstName, lastName, hashedPassword });

        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        await setTokenCookie(res, safeUser);

        return res.json({
            user: safeUser,
        });
    } catch (err) {
        return res.status(401).json({
            message: "Invalid credentials were submitted."
        })
    }
});
 



module.exports = router;
