const express = require('express');
const router = express.Router();

const { Review, Spot, ReviewImage, User, sequelize } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const checkValidateReview = [
    check('review').exists({ checkFalsy: true }).withMessage('Review text is required'),
    check('stars').exists({ checkFalsy: true }).withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors,
];
router.get('/current', requireAuth, async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: {
                userId: req.user.id,
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName'],
                },
                {
                    model: Spot,
                    attributes: {
                        include: [[sequelize.fn('MAX', sequelize.col('url')), 'previewImage']],
                        exclude: ['createdAt', 'updatedAt', 'description'],
                    },
                },
                {
                    model: ReviewImage,
                    attributes: ['id', 'url'],
                },
            ],
        });

        const reviewReponse = { Reviews: reviews };

        return res.json(reviewReponse);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

router.delete('/:reviewId', requireAuth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findByPk(reviewId);

        if (!review) return res.status(404).json({ message: "Review couldn't be found" });
        if (review.userId !== req.user.id)
            return res
                .status(403)
                .json({ message: 'You are not authorized to delete this review.' });

        await review.destroy();

        return res.json({ message: 'Successfully deleted' });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});
// ADD IMAGE TO REVIEW BASED ON REVIEWID
router.post('/:reviewId/images', requireAuth, async (req, res, next) => {
    const { url } = req.body;
    let { reviewId } = req.params;
    const reviewImagesCount = await ReviewImage.count({
        where: {
            reviewId,
        },
    });

    const review = await Review.findByPk(reviewId);
    if (!review) {
        return res.status(404).json({ message: "Review cound't be found" });
    }
    if (req.user.id !== review.userId) {
        return res.status(403).json({
            message: 'Forbidden',
        });
    }
    if (reviewImagesCount >= 10) {
        return res.status(403).json({
            message: 'Maximum number of images for this resource was reached',
        });
    }

    const image = await ReviewImage.create({ url, reviewId });

    return res.status(200).json({
        id: image.id,
        url: image.url,
    });
});

//EDIT A REVIEW
router.put('/:reviewId', requireAuth, checkValidateReview, async (req, res, next) => {
    const { reviewId } = req.params;
    const { review, stars } = req.body;
    if (!review || !stars) {
        return res.json({ message: 'not a review or stars' });
    }
    const editReview = await Review.findByPk(reviewId);

    if (!editReview) return res.status(404).json({ message: "Review couldn't be found" });
    if (editReview.userId !== req.user.id) {
        return res.status(403).json({
            message: 'Forbidden',
        });
    }
    editReview.review = review;
    editReview.stars = stars;
    await editReview.save();

    const formattedCreatedAt = new Date(editReview.createdAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    const formattedUpdatedAt = new Date(editReview.updatedAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);

    return res.status(200).json({
        id: editReview.id,
        userId: editReview.userId,
        spotId: editReview.spotId,
        review: editReview.review,
        stars: editReview.stars,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
    });
});

module.exports = router;
