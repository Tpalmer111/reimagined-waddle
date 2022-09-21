const express = require('express')
const router = express.Router()
const db = require('../models')


router.post('/:id/reviews', async (req, res) => {
    
    try {
        await db.review.create({
            song: req.body.song,
            rating: req.body.rating,
            albumId: req.params.id
        })
        res.redirect('/users/reviews?albumId=' + req.params.id)

    }catch(err) {
        console.log(err)
        res.send('server error')
    }
})



module.exports = router