const express = require('express');
const { requireAuth } = require('../../utils/auth');
const router = express.Router();
const { Booking } = require('../../db/models');

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

module.exports = router;
