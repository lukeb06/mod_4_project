'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Review extends Model {
        static associate(models) {
            // define association here
            Review.belongsTo(models.User, {
                foreignKey: 'userId',
            });
            Review.belongsTo(models.Spot, {
                foreignKey: 'spotId',
            });

            Review.hasMany(models.ReviewImage, {
                foreignKey: 'reviewId',
            });
        }
    }

    Review.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            spotId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            review: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            stars: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Review',
        },
    );
    return Review;
};
