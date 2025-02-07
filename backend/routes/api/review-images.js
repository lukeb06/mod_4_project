const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Review, ReviewImage } = require('../../db/models');
const router = express.Router();

// Delete a Review Image
router.delete('/:imageId',requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const imageId = parseInt(req.params.imageId);
        const reviewImageToDelete = await ReviewImage.findByPk(imageId)
        const reviewId = reviewImageToDelete.reviewId
        const review = await Review.findByPk(reviewId)

        
        if (!userId == review.userId) {
            throw new Error ('Forbidden')
        }

        if (!reviewImageToDelete) {
            res.status(404).json({
                message: "Review Image couldn't be found"
            })
        }

        await reviewImageToDelete.destroy();
        return res.status(200).json({
            message: "Successfully deleted"
            })
            
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
    
})

module.exports = router;