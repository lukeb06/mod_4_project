'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            'Spots',
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },
                address: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
                city: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                },
                state: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                },
                country: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                },
                lat: {
                    type: Sequelize.DECIMAL(8, 6),
                    allowNull: false,
                },
                lng: {
                    type: Sequelize.DECIMAL(9, 6),
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(500),
                    allowNull: false,
                },
                price: {
                    type: Sequelize.DECIMAL(7, 2),
                    allowNull: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
            options,
        );
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'Spots';
        return queryInterface.dropTable(options);
    },
};
