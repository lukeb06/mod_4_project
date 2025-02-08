const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot, SpotImage, sequelize } = require('../../db/models');
const router = express.Router();

// DELETE A BOOKING
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    const { bookingId } = req.params;

    const bookingToDelete = await Booking.findByPk(bookingId);
    if (!bookingToDelete) return res.status(404).json({ message: 'Booking not found' });


    const date = new Date();
    if (date >= bookingToDelete.startDate) {
        return res.status(400).json({
            message: 'Your booking has already been confirmed and cannot be deleted ',
        });
    }

    if (bookingToDelete.userId !== req.user.id) {
        return res.status(400).json({
            message: 'You are not authorized to delete this booking',
        });
    }

    await bookingToDelete.destroy();
    res.status.json({
        message: 'booking was successfully deleted',
    });
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


// Edit a booking
router.put('/:bookingId',requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.body;
        const bookingId = parseInt(req.params.bookingId);
        const currentDate = new Date();

        const booking = await Booking.findByPk(bookingId);
        const spotId = booking.get('spotId');
        
        const existingBookings = await Booking.findAll({
            where: {
                spotId
            }
        })

        if (new Date(startDate) < currentDate) {
            res.status(400).json({
                message: "Bad Request",
                error: {
                    startDate: 'startDate cannot be in the past'
                }
            })
        }

        if (new Date(endDate) < new Date(startDate)) {
            res.status(400).json({
                message: "Bad Request",
                error: {
                    endDate: 'endDate cannot be on or before startDate'
                }
            })
        }

        if (!booking) {
            res.status(404).json({
                message: 'Booking couldn\'t be found'
            })
        }

        if (new Date(endDate) < currentDate) {
            res.status(403).json({
                message: 'Past bookings can\'t be modified'
            })
        }

        existingBookings.forEach((booking) => {
            let prevStartDate = booking.startDate;
            prevStartDate = prevStartDate.toISOString().split('T')[0]

            let prevEndDate = booking.endDate;
            prevEndDate = prevEndDate.toISOString().split('T')[0]

            if (startDate === prevStartDate) {
                res.status(403).json({
                    message: "Sorry, this spot is already booked for the specified dates",
                    error: {
                        startDate: "Start date conflicts with an existing booking"
                    }
                })
            }  
            if (endDate === prevEndDate) {
                res.status(403).json({
                    message: "Sorry, this spot is already booked for the specified dates",
                    error: {
                        endDate: "End date conflicts with an existing booking"
                    }
                })
            }
        })

        if (!userId == booking.get('userId')) {
            throw new Error ('Forbidden')
        }

        await Booking.update(
            {
                startDate,
                endDate
            },
            {
                where: {
                    id: bookingId
                }
            }
            
        )

        const updatedBooking = await Booking.findByPk(bookingId)

        res.json(updatedBooking)

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message
        })
    }


})

module.exports = router;
