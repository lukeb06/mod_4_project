const express = require('express');
const router = express.Router();

const { Review, Spot, ReviewImage, User, sequelize } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

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

module.exports = router;
