const express = require('express');
const { check } = require('express-validator');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { Booking, Spot, SpotImage, sequelize } = require('../../db/models');
const router = express.Router();

// DELETE A BOOKING
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const bookingToDelete = await Booking.findOne({
            where: {
                id: bookingId,
            },
        });

        if (!bookingToDelete) return res.status(404).json({ message: 'Booking not found' });
        if (req.user.id !== bookingToDelete.userId)
            return res.status(403).json({ message: 'Forbidden' });

        if (date >= bookingToDelete.startDate) {
            return res.status(400).json({
                message: 'Your booking has already been confirmed and cannot be deleted ',
            });
        }

        await bookingToDelete.destroy();
        return res.status(200).json({
            message: 'Your booking has successfully been deleted',
        });
    } catch (error) {
        return res.status(404).json({
            message: 'Booking was not found',
        });
    }
});

//  RETURN ALL OF THE BOOKINGS OF CURRENT USER
router.get('/current', requireAuth, async (req, res, next) => {
    try {
        const currentBooking = await Booking.findAll({
            where: {
                userId: req.user.id,
            },
            include: [
                {
                    model: Spot,
                    attributes: {
                        include: [[sequelize.fn('MAX', sequelize.col('url')), 'previewImage']],
                        exclude: ['description', 'createdAt', 'updatedAt'],
                    },
                    include: [
                        {
                            model: SpotImage,
                            attributes: ['url'],
                        },
                    ],
                },
            ],
        });

        return res.json(currentBooking);
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

module.exports = router;
