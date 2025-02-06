const express = require('express');

const { requireAuth } = require('../../utils/auth');
const {
    User,
    Spot,
    SpotImage,
    Review,
    ReviewImage,
    sequelize,
    Booking,
} = require('../../db/models');
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

        const newSpot = await Spot.create({
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
            id: newSpot.id,
            ownerId: newSpot.ownerId,
            newSpot,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

router.get('/', async (_, res) => {
    try {
        const spots = await Spot.findAll({
            attributes: [
                'id',
                'ownerId',
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
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

router.get('/current', requireAuth, async (req, res) => {
    try {
        const spots = await Spot.findAll({
            attributes: [
                'id',
                'ownerId',
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
            where: {
                ownerId: req.user.id,
            },
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
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// EDIT A SPOT

router.put('/:spotId', requireAuth, validateCreateSpot, async (req, res, next) => {
    try {
        const { spotId } = req.params.id;
        const { address, city, state, country, lat, lng, name, description, price } = req.body;

        const spotToUpdate = await Spot.findByPk(spotId);

        if (!spotToUpdate) {
            res.status(400).json({
                message: 'Not a valid spot',
            });
        }
        if (req.user.id === spotToUpdate.ownerId) {
            await spotToUpdate.update({
                address: address,
                city: city,
                state: state,
                country: country,
                lat: lat,
                lng: lng,
                name: name,
                description: description,
                price: price,
            });
            res.json(spotToUpdate);
            res.status(200);
        }
    } catch (error) {
        res.status(404).json({
            message: 'Spot was not found',
        });
    }
});

// Create a Review for a Spot based on the Spot's id
const validateCreateReview = [
    check('review').exists({ checkFalsy: true }).notEmpty().withMessage('Review text is required'),
    check('stars')
        .exists({ checkFalsy: true })
        .isInt({ min: 1, max: 5 })
        .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors,
];

router.post('/:spotId/reviews', requireAuth, validateCreateReview, async (req, res) => {
    const id = req.params.spotId;
    const spotId = parseInt(id);
    const { review, stars, createdAt, updatedAt } = req.body;
    const userId = req.user.id;

    // check if Spot does not exist
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
        });
    }

    // check if the review from current user already exists for the spot
    const currentReview = await Review.findOne({
        where: {
            spotId,
            userId,
        },
    });

    if (currentReview) {
        return res.status(500).json({
            message: 'User already has a review for this spot',
        });
    }

    const newReview = await Review.create({
        id,
        userId,
        spotId,
        review,
        stars,
        createdAt,
        updatedAt,
    });

    res.status(201).json({ newReview });
});

router.delete('/:spotId', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const spotToDelete = await Spot.findByPk(spotId);

    if (!spotToDelete) {
        return res.status(404).json({
            message: "Spot couldn't be found",
        });
    }

    if (req.user.id !== spotToDelete.ownerId) {
        return res.status(403).json({
            message: 'Forbidden',
        });
    }

    await spotToDelete.destroy();
    return res.status(200).json({
        message: 'Successfully deleted',
    });
});

// Get all reviews by the Spot's id
router.get('/:spotId/reviews', async (req, res) => {
    const spotId = req.params.spotId;

    const currentSpot = await Spot.findByPk(spotId);

    const spotReviews = await Review.findAll({
        where: {
            spotId,
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName'],
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url'],
            },
        ],
    });

    if (!currentSpot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
        });
    }

    res.status(200).json({ spotReviews });
});

router.get('/:spotId/bookings', requireAuth, async (req, res) => {
    try {
        const { spotId } = req.params;

        const spot = await Spot.findByPk(spotId);

        if (!spot) return res.status(404).json({ message: "Spot couldn't be found" });

        const bookings = await Booking.findAll({
            where: {
                spotId,
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName'],
                },
            ],
        });

        if (spot.ownerId === req.user.id) {
            return res.json(bookings);
        } else {
            return res.json(
                bookings.map(booking => {
                    return {
                        spotId: booking.spotId,
                        startDate: booking.startDate,
                        endDate: booking.endDate,
                    };
                }),
            );
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

// Create a booking for a spot based on the Spot's id
router.post('/:spotId/bookings', async (req, res) => {
    try {
        const spotId = parseInt(req.params.spotId);
        const userId = req.user.id
        const { startDate, endDate } = req.body;
        const spot = await Spot.findByPk(spotId);
        const currentDate = new Date()

        const bookings = await Booking.findAll({
            where : {
                spotId
            }
        });

        if (!spot) {
            res.status(404).json({
                message: "Spot couldn't be found",
            });
        }

        if (new Date(startDate) < currentDate) {
            res.status(400).json({
                message: "Bad Request",
                error: 'startDate cannot be in the past'
            })
        }

        if (new Date(endDate) < new Date(startDate)) {
            res.status(400).json({
                message: "Bad Request",
                error: 'endDate cannot be on or before startDate'
            })
        }
        
        bookings.forEach((booking) => {
            let prevStartDate = booking.startDate;
            prevStartDate = prevStartDate.toISOString().split('T')[0]

            let prevEndDate = booking.endDate;
            prevEndDate = prevEndDate.toISOString().split('T')[0]

            if (startDate === prevStartDate) {
                const error = new Error('Start date conflicts with an existing booking')
                error.status = 403
                throw error
            }  
            if (endDate === prevEndDate) {
                const error = new Error('End date conflicts with an existing booking')
                error.status = 403
                throw error
            }
        })

        const newBooking = await Booking.create({
            spotId,
            userId,
            startDate,
            endDate
        })

        return res.json(newBooking)
        

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message,
        });
    }
});

module.exports = router;
