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

module.exports = router;
