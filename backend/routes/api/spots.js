const express = require('express');
const bcrypt = require('bcryptjs');

const { requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, sequelize } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();

const validateCreateSpot = [
    check('address')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('Street address is required'),
    check('city').exists({ checkFalsy: true }).notEmpty().withMessage('City is required'),
    check('state').exists({ checkFalsy: true }).notEmpty().withMessage('State is required'),
    check('country').exists({ checkFalsy: true }).notEmpty().withMessage('Country is required'),
    check('lat')
        .exists({ checkFalsy: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be within -90 and 90'),
    check('lng')
        .exists({ checkFalsy: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Latitude must be within -180 and 180'),
    check('name')
        .exists({ checkFalsy: true })
        .notEmpty()
        .isLength({ max: 50 })
        .withMessage('Name must be less than 50 characters'),
    check('description')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('Description is required'),
    check('price')
        .exists({ checkFalsy: true })
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage('Price per day must be a positive number'),
    handleValidationErrors,
];

// Create a spot
router.post('/', requireAuth, validateCreateSpot, async (req, res) => {
    try {
        const {
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price,
            createdAt,
            updatedAt,
        } = req.body;
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
            createdAt,
            updatedAt,
        });

        res.status(201).json({
            spot: {
                id: spot.id,
                ownerId: spot.ownerId,
                address: spot.address,
                city: spot.city,
                state: spot.state,
                country: spot.country,
                lat: spot.lat,
                lng: spot.lng,
                name: spot.name,
                description: spot.description,
                price: spot.price,
                createdAt: spot.createdAt,
                updatedAt: spot.updatedAt,
            },
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

router.get('/', async (req, res) => {
    const spots = await Spot.findAll({
        attributes: [
            'id',
            'address',
            'city',
            'state',
            'country',
            'lat',
            'lng',
            'name',
            'description',
            'price',
            'createdAt',
            'updatedAt',
            [sequelize.fn('MAX', sequelize.col('url')), 'previewImage'],
            [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating'],
        ],
        include: [
            {
                model: SpotImage,
                attributes: ['url'],
                where: {
                    preview: true,
                },
            },
            {
                model: Review,
                attributes: ['stars'],
            },
        ],
    });

    const spotsResponse = spots.map(spot => {
        return {
            ...spot.dataValues,
            SpotImages: undefined,
            Reviews: undefined,
        };
    });

    return res.json(spotsResponse);
});

module.exports = router;
