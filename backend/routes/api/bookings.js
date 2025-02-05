const express = require('express');
const { check } = require('express-validator');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { Booking, Spot, SpotImage, sequelize } = require('../../db/models');
const router = express.Router();

// DELETE A BOOKING
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const bookingToDelete = await Booking.findOne({
            where: {
                id: bookingId,
            },
        });
        const date = new Date();

        if (bookingToDelete) {
            if (req.user.id === booking.userId) {
                await bookingToDelete.destroy();
                res.status(200).json({
                    message: 'Your booking has successfully been deleted',
                });
            }
            if (date >= booking.startDate) {
                res.status(400).json({
                    message: 'Your booking has already been confirmed and cannot be deleted ',
                });
            }
        }
    } catch (error) {
        res.status(404).json({
            message: 'booking was not found',
        });
    }
});


//  RETURN ALL OF THE BOOKINGS OF CURRENT USER

router.get('/current', async (req, res, next) => {
    try {
        const currentBooking = await Booking.findAll({
            where: {
                userId: 1
            },
            include: [
                {
                    model: Spot,
                    attributes: {
                        include: [[sequelize.fn('MAX', sequelize.col('url')), 'previewImage']],
                        exclude: ['description', 'createdAt', 'updatedAt'],
                    },
                },
                {
                    model: Booking,
                    attributes: ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', "updatedAt"] 
                    
                },
                {
                    model: SpotImage,
                    attributes: ['url']
                }

            ],
        })

        
        return res.json( currentBooking )
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
})

module.exports = router;

