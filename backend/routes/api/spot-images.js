const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { SpotImage } = require('../../db/models');
const router = express.Router();

router.delete('/:spotId', requireAuth, async (req, res) => {
    const { spotId } = req.params;

    const spotImageToDelete = await SpotImage.findByPk(spotId);
    if (!spotImageToDelete)
        return res.status(404).json({ message: "Spot Image couldn't be found" });

    if (req.user.id !== spotImageToDelete.userId)
        return res.status(403).json({ message: 'Forbidden' });

    await spotImageToDelete.destroy();
    res.status(200).json({
        message: 'Successfully deleted',
    });
});

module.exports = router;
