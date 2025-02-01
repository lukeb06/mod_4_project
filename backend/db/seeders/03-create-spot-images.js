'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await SpotImage.bulkCreate(
            [
                {
                    spotId: 1,
                    url: 'https://picsum.photos/300/200',
                    preview: true,
                },
                {
                    spotId: 1,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },
                {
                    spotId: 1,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },

                {
                    spotId: 2,
                    url: 'https://picsum.photos/300/200',
                    preview: true,
                },
                {
                    spotId: 2,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },
                {
                    spotId: 2,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },

                {
                    spotId: 3,
                    url: 'https://picsum.photos/300/200',
                    preview: true,
                },
                {
                    spotId: 3,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },
                {
                    spotId: 3,
                    url: 'https://picsum.photos/300/200',
                    preview: false,
                },
            ],
            { validate: true },
        );
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'SpotImages';
        const Op = Sequelize.Op;
        return queryInterface.bulkDelete(
            options,
            {
                spotId: { [Op.in]: [1, 2, 3] },
            },
            {},
        );
    },
};
