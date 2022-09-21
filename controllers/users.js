require('dotenv').config()
const express = require('express')
const router = express.Router()
const db = require('../models')
const crypto = require('crypto-js')
const bcrypt = require('bcrypt')
const axios = require('axios')

//router.use(express.urlencoded({extended: false})) 

// GET /users/new -- render a form to create a new user
router.get('/new', (req, res) => {
    res.render('users/new.ejs')
})

// POST /users -- create a new user in the db
router.post('/', async (req, res) => {
    try {

        // has the password from the req.body
        const hashedPassword = bcrypt.hashSync(req.body.password, 12)        
        // create a new user
        const [newUser, created] = await db.user.findOrCreate({
            where: {
                email: req.body.email
            }, 
            defaults: {
                password: hashedPassword
            }
        })

        // if the user was found...send them to the login form
        // console.log('created is:',  created)
        if (!created) {
            // console.log('user exists already')
            res.redirect('/users/login?message=Please log into your account to continue.')
        } else {
            // store that new user's id as a cookie in the browser
            const encryptedUserId = crypto.AES.encrypt(newUser.id.toString(), process.env.ENC_SECRET)
            const encryptedUserIdString = encryptedUserId.toString()
            res.cookie('userId', encryptedUserIdString)
            // redirect to the homepage
            res.redirect('/users/profile')
        }

    } catch(err) {
        console.log(err)
        res.send('server error')
    }
})

//http://127.0.0.1:3000/users/login?message=Incorrect%20username%20or%20password
// GET /users/login -- show a login form to the user
router.get('/login', (req, res) => {
    // console.log(req.query)
    res.render('users/login.ejs', {
        // if the req.query.message exists, pass it is as the message, otherwise pass in null
        // ternary operator
        // condition ? expression if truthy : expression if falsy
        message: req.query.message ? req.query.message : null
    })
})

// POST /users/login -- accept a payload of form data and use it log a user in 
router.post('/login', async (req, res) => {
    try {
        // look up the user in the db using the supplied email
        const user = await db.user.findOne({ 
            where: {
                email: req.body.email
            } 
        })
        const noLoginMessage = 'Incorrect username or password'

        // if the user is not found -- send the user back to the login form
        if (!user) {
            console.log('user not found')
            res.redirect('/users/login?message=' + noLoginMessage)
        // if the user is found but has given the wrong password -- send them back to the login form
        } else if (!bcrypt.compareSync(req.body.password, user.password)) {
            console.log('wrong password')
            res.redirect('/users/login?message=' + noLoginMessage)
        // if the user is found and the supplied password matches what is in the database -- log them in
        } else {
            const encryptedUserId = crypto.AES.encrypt(user.id.toString(), process.env.ENC_SECRET)
            const encryptedUserIdString = encryptedUserId.toString()
            res.cookie('userId', encryptedUserIdString)
            res.redirect('/users/profile')
        }
    } catch(err) {
        console.log(err)
        res.send('server error')
    }
})

// GET /users/logout -- log out a user by clearing the stored cookie
router.get('/logout', (req, res) => {
    // clear the cookie
    res.clearCookie('userId')
    // redirect to the homepage
    res.redirect('/')
})


router.get('/profile', (req, res) => {
    res.render('users/profile.ejs')
})
router.get('/search', async (req, res) => {
    const search = req.query.albumSearch
    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=album.search&album=${search}&api_key=${process.env.API_KEY}&format=json`);
    // console.log(response.data.results.albummatches)
    res.render('users/results.ejs', { albums: response.data.results.albummatches.album});
})


router.get('/albums', async (req, res) => {
try {
    const allAlbums = await db.album.findAll({
        where: {
            userId: res.locals.user.id
        }
    })
    res.render('users/albums.ejs', {allAlbums})
} catch (err) {
    console.log(err)
    res.send('server error')
}
})

router.post('/albums', async (req, res) => {
    try {
        await db.album.create({
            title: req.body.title,
            artist: req.body.artist,
            userId: res.locals.user.id
        })
        res.redirect('/users/albums')
    }catch (err) {
        console.log(err)
        res.send('server error')
    }
})

router.delete('/albums/:id', async (req, res) => {
    try {
        await db.album.destroy({
            where: {
                id: req.params.id
            }
        })
        res.redirect('/users/albums')
    }catch (err) {
        console.log(err)
        res.send('server error')
    }
})

// router.post('/reviews', async (req, res) => {
//     try {
        // const album = await db.album.findByPk(req.body.albumId, {
        //     include: [db.review]
        // })

//         res.render('users/reviews.ejs', {album: album})
//         } catch (err) {
//             console.log(err)
//             res.send('server error')
//         }
// })

router.get("/reviews", async (req, res) => {
    console.log(req.query.albumId)
    try {
        const reviews = await db.review.findAll({
            where: {
                albumId: req.query.albumId
            }
        })
        const album = await db.album.findByPk(req.query.albumId, {
            include: [db.review]
        })
        res.render('users/reviews.ejs', {album: album, reviews: reviews})
        } catch (err) {
            console.log(err)
            res.send('server error')
        }
})

router.get('/update', async (req, res) => {
    res.render('users/update.ejs')
})

// router.put('/users')


module.exports = router