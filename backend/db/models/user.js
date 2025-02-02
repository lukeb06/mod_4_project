'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // define association here
            User.hasMany(models.Spot, {
                foreignKey: "ownerId"
            })
            User.hasMany(models.Review, {
                foreignKey: "userId"
            })
            User.hasMany(models.Booking, {
                foreignKey: "userId"
            })
        }
    }

    User.init(
        {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    len: [4, 30],
                    isNotEmail(value) {
                        if (Validator.isEmail(value)) {
                            throw new Error('Cannot be an email.');
                        }
                    },
                },
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    len: [3, 256],
                    isEmail: true,
                },
            },
            hashedPassword: {
                type: DataTypes.STRING.BINARY,
                allowNull: false,
                validate: {
                    len: [60, 60],
                },
            },
        },
        {
            sequelize,
            modelName: 'User',
            defaultScope: {
                attributes: {
                    exclude: ['hashedPassword', 'email', 'createdAt', 'updatedAt'],
                },
            },
        },
    );
    return User;
};
