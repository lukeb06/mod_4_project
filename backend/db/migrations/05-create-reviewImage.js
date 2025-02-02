'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'ReviewImages',
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },
                url: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
            },
            options,
        );
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'ReviewImages';
        return queryInterface.dropTable(options);
    },
};
