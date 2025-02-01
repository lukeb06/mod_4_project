const express = require('express');

const router = express.Router();

const { Spot, SpotImage, Review, sequelize } = require('../../db/models');

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
