const express = require('express');

const { requireAuth } = require('../../utils/auth');
const {
    User,
    Spot,
    SpotImage,
    Review,
    ReviewImage,
    Booking,
    sequelize,
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

router.get('/current', requireAuth, async (req, res) => {
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
});

// Get detail for a spot from an Id
router.get('/:spotId', async (req, res) => {
    const { spotId } = req.params;

    const reviews = await Review.findAll({
        where: {
            spotId,
        },
        attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'numReviews'],
            [sequelize.fn('AVG', sequelize.col('stars')), 'avgStarRating'],
        ],
    });

    const spot = await Spot.findByPk(spotId, {
        include: [
            {
                model: SpotImage,
                attributes: ['id', 'url', 'preview'],
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName'],
            },
        ],
    });

    if (!spot)
        return res.status(404).json({
            message: "Spot couldn't be found",
        });

    if (!spot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
        });
    }

    const formattedCreatedAt = new Date(spot.createdAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    const formattedUpdatedAt = new Date(spot.updatedAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);

    const result = {
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
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
        numReviews: reviews[0].get('numReviews'),
        avgStarRating: reviews[0].get('avgStarRating'),
        SpotImages: spot.SpotImages,
        Owner: spot.Owner,
    };

    return res.status(200).json(result);
});

// Create a spot
router.post('/', validateCreateSpot, async (req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const ownerId = req.user?.id || 1;

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
    });

    const formattedCreatedAt = new Date(newSpot.createdAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    const formattedUpdatedAt = new Date(newSpot.updatedAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);

    res.status(201).json({
        id: newSpot.id,
        ownerId: newSpot.ownerId,
        address: newSpot.address,
        city: newSpot.city,
        state: newSpot.state,
        country: newSpot.country,
        lat: newSpot.lat,
        lng: newSpot.lng,
        name: newSpot.name,
        description: newSpot.description,
        price: newSpot.price,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
    });
});

router.get('/', async (req, res) => {
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
});

// EDIT A SPOT

router.put('/:spotId', requireAuth, validateCreateSpot, async (req, res, next) => {
    const { spotId } = req.params;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const spotToUpdate = await Spot.findByPk(spotId);

    if (!spotToUpdate) {
        return res.status(404).json({
            message: "Spot couldn't be found",
        });
    }
    if (req.user.id !== spotToUpdate.ownerId) {
        return res.status(403).json({
            message: 'You do not own this spot',
        });
    }
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
    return res.status(200).json(spotToUpdate);
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
    const spotId = parseInt(req.params.spotId);
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
        userId,
        spotId,
        review,
        stars,
        createdAt,
        updatedAt,
    });

    const formattedCreatedAt = new Date(newReview.createdAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    const formattedUpdatedAt = new Date(newReview.updatedAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);

    return res.status(201).json({
        id: newReview.id,
        userId: newReview.userId,
        spotId: newReview.spotId,
        review: newReview.review,
        stars: newReview.stars,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
    });
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
    return res.json({
        message: 'Successfully deleted',
    });
});

// Get all reviews by the Spot's id
router.get('/:spotId/reviews', async (req, res) => {
    const spotId = req.params.spotId;

    const currentSpot = await Spot.findByPk(spotId);

    const Reviews = await Review.findAll({
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

    res.status(200).json({ Reviews });
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

//ADD AN IMAGE TO A SPOT BASED ON THE SPOT'S ID
router.post('/:spotId/images', requireAuth, async (req, res, next) => {
    const { spotId } = req.params;
    const { url } = req.body;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);

    if (!spot) return res.status(404).json({ message: "Spot couldn't be found" });
    if (spot.ownerId !== userId) {
        return res.status(403).json({
            message: 'Forbidden',
        });
    }

    const image = await SpotImage.create({
        spotId,
        url,
        preview: false,
    });
    return res.status(201).json({
        id: image.id,
        url: image.url,
        preview: image.preview,
    });
});

// Create a booking for a spot based on the Spot's id
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
    try {
        const spotId = parseInt(req.params.spotId);
        const userId = req.user.id;
        const { startDate, endDate } = req.body;
        const spot = await Spot.findByPk(spotId);
        const currentDate = new Date();

        const bookings = await Booking.findAll({
            where: {
                spotId,
            },
        });

        if (!spot) {
            res.status(404).json({
                message: "Spot couldn't be found",
            });
        }

        if (new Date(startDate) < currentDate) {
            res.status(400).json({
                message: 'Bad Request',
                error: 'startDate cannot be in the past',
            });
        }

        if (new Date(endDate) < new Date(startDate)) {
            res.status(400).json({
                message: 'Bad Request',
                error: 'endDate cannot be on or before startDate',
            });
        }

        bookings.forEach(booking => {
            let prevStartDate = booking.startDate;
            prevStartDate = prevStartDate.toISOString().split('T')[0];

            let prevEndDate = booking.endDate;
            prevEndDate = prevEndDate.toISOString().split('T')[0];

            if (startDate === prevStartDate) {
                const error = new Error('Start date conflicts with an existing booking');
                error.status = 403;
                throw error;
            }
            if (endDate === prevEndDate) {
                const error = new Error('End date conflicts with an existing booking');
                error.status = 403;
                throw error;
            }
        });

        if (userId == spot.ownerId) {
            throw new Error('You cannot book your own spot. Please choose a different spot');
        }

        const newBooking = await Booking.create({
            spotId,
            userId,
            startDate,
            endDate,
        });

        return res.json(newBooking);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message,
        });
    }
});

module.exports = router;
