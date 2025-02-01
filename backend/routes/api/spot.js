const express = require('express');
const bcrypt = require('bcryptjs');

const { requireAuth } = require('../../utils/auth');
const { Spot } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();

const validateCreateSpot = [
    check('address')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('Address can not be empty'),
    check('city').exists({ checkFalsy: true }).notEmpty().withMessage('City can not be empty'),
    check('state').exists({ checkFalsy: true }).notEmpty().withMessage('State can not be empty'),
    check('country')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('Country can not be empty'),
    check('lat').exists({ checkFalsy: true }).withMessage('Please provide a latitude'),
    check('lng').exists({ checkFalsy: true }).withMessage('Please provide a longitude'),
    check('name').exists({ checkFalsy: true }).notEmpty().withMessage('Please provide a name'),
    check('description')
        .exists({ checkFalsy: true })
        .notEmpty()
        .isString()
        .withMessage('Description must be a string'),
    check('price')
        .exists({ checkFalsy: true })
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage('Price must be a valid number and greater or equal to 0'),
    handleValidationErrors,
];

// Create a spot
router.post('/', requireAuth, validateCreateSpot, async (req, res) => {
    try {
        const { address, city, state, country, lat, lng, name, description, price } = req.body;
        const ownerId = req.user.id;

        const spot = await Spot.create({
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price,
            ownerId,
        });

        res.status(201).json({
            message: 'Successfully added a spot',
            spot,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

module.exports = router;
