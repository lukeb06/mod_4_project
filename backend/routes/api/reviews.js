const express = require('express');
const router = express.Router();

const { Review, Spot, ReviewImage, User, sequelize } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const checkValidateReview = [
    check('review')
        .exists({ checkFalsy: true })
        .withMessage("Review text is required"),
    check('stars')
        .exists({ checkFalsy: true })
        .withMessage("stars must be an integer from 1 to 5"),
    handleValidationErrors
]
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
                    where: {
                        preview: true,
                    },
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

        return res.json(reviews);
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
            reviewId
        }
    })
    
    const review = await Review.findByPk(reviewId);
    if (!review) {
        return res.status(404).json({ message: "Review not found"})
    }
    if (req.user.id !== review.userId) {
        return res.status(403).json({
            message: "forbidden"
        })
    }
    if (reviewImagesCount >= 10) {
        return res.status(400).json({
            message: "Maximum number of images has been reached"
        })
    }


    const image = await ReviewImage.create({ url, reviewId })

    return res.status(201).json(image);
})


//EDIT A REVIEW
router.put('/:reviewId',requireAuth, checkValidateReview, async (req, res, next) => {
    const { reviewId } = req.params
    const { review, stars } = req.body;
    if (!review || !stars) {
        return res.json({ message: "not a review or stars"})
    }
    const editReview = await Review.findByPk(reviewId);

    if (!editReview) return res.status(404).json({ message: "Review was not found" })
    if (editReview.userId !== req.user.id) {
        return res.status(403).json({
            message: 'You are not authorized to edit this review.'
        })
    };
    editReview.review = review;
    editReview.stars = stars;
    await editReview.save();
    return res.status(200).json(editReview);
})

module.exports = router;
