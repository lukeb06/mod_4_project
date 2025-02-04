const express = require('express');
const { check } = require('express-validator');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { handleValidationErrors } = require('../../utils/validation');
const { booking } = require('../../db/models/booking');
const booking = require('../../db/models/booking');
const router = express.Router();

// DELETE A BOOKING
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    try {
        const bookingId = req.params.id;
        const bookingToDelete = await booking.findOne({
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

module.exports = router;

