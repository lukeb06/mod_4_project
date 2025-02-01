'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA; // define your schema in options object
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'Reviews',
            'userId',
            {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users',
                },
                onDelete: 'CASCADE',
            },
            {
                after: 'id',
            },
            options,
        );
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Reviews', 'userId', options);
    },
};
