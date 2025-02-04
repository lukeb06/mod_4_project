'use strict';

const { Review } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await Review.bulkCreate(
            [
                {
                    spotId: 1,
                    userId: 1,
                    review: 'This was an awesome spot!',
                    stars: 5,
                },
                {
                    spotId: 1,
                    userId: 2,
                    review: 'Such an amazing spot! Would recommend to anyone!',
                    stars: 5,
                },
                {
                    spotId: 1,
                    userId: 3,
                    review: 'Definitely a good pick but not the best EVER!',
                    stars: 4,
                },
                {
                    spotId: 2,
                    userId: 1,
                    review: 'This spot was okay...',
                    stars: 3,
                },
                {
                    spotId: 2,
                    userId: 3,
                    review: 'This spot was meh...',
                    stars: 2,
                },
                {
                    spotId: 3,
                    userId: 2,
                    review: 'This spot was HORRIBLE!!!',
                    stars: 1,
                },
                {
                    spotId: 3,
                    userId: 1,
                    review: 'This spot was TERRIBLE!!!',
                    stars: 2,
                },
            ],
            { validate: true },
        );
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'Reviews';
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
