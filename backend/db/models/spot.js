'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Spot extends Model {
        static associate(models) {
            // define association here
            Spot.belongsTo(models.User, {
                foreignKey: "ownerId"
            })

            Spot.hasMany(models.SpotImage, {
                foreignKey: "spotId"
            })

            Spot.hasMany(models.Review, {
                foreignKey: "spotId"
            })

            Spot.hasMany(models.Booking, {
                foreignKey: "spotId"
            })
        }
    }

    Spot.init(
        {   
            ownerId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false
            },
            city: {
                type: DataTypes.STRING,
                allowNull: false
            },
            state: {
                type: DataTypes.STRING,
                allowNull: false
            },
            country: {
                type: DataTypes.STRING,
                allowNull: false
            },
            lat: {
                type: DataTypes.DECIMAL(8,6),
                allowNull: false,
            },
            lng: {
                type: DataTypes.DECIMAL(9, 6),
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.STRING,
                allowNull: false
            },
            price: {
                type: DataTypes.DECIMAL(7, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Spot',
            defaultScope: {
                attributes: {
                    exclude: ['createdAt', 'updatedAt'],
                },
            },
        },
    );
    return Spot;
};