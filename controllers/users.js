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
    console.warn("test 2")
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
        console.log('created is:',  created)
        if (!created) {
            console.log('user exists already')
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
    console.log(req.query)
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
    console.log('test 1')
    // if the user is not logged ... we need to redirect to the login form
    if (!res.locals.user) {
        res.redirect('/users/login?message=You must authenticate before you are authorized to view this resource.')
    // otherwise, show them their profile
    } else {
        console.log("the current user is: " + res.locals.user)
        res.render('users/profile.ejs', {
            user: res.locals.user
        })
    }
})

router.get('/search', (req, res) => {

    axios.get(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${req.query.albumSearch}&api_key=${process.env.API_KEY}&format=json`) 
        .then(response => {
        // res.render('users/search.ejs', {albums: response.data.Search})
        console.log(response.data.Search)
    })
    .catch(console.warn("server error is coming from inside the house..."))
})

// router.get('/albums/:id', (req, res) => {
//     console.log(req.params.id)
//     axios.get(`http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${req.params.id}&api_key=${process.env.API_KEY}&format=json`)
//       .then(response => {
//         res.render('detail.ejs', { album: response.data })
//       })
//       .catch(console.log)
//   })

router.get('/comment', (req, res) => {
    res.render('users/comment.ejs')
})

router.get('/update', (req, res) => {
    res.render('users/update.ejs')
})

// router.get('/albums/:id', (req, res) => {
//     res.render('show album information: title, artist, etc.')
// })

// router.get('/albums/:id/comment', (req, res) => {
//     res.render('show album comments')
// })

// router.post('/albums', (req, res) => {
//     console.log('add this album to user profile')
// })

// router.post('/albums/:id/comment', (req, res) => {
//     console.log('add this comment to this album')
// })

// router.put('/users', (req, res) => {
//     console.log('update this user with this new email/password')
// })

// router.put('/comments/:id', (req, res) => {
//     console.log('update this comment on this album')
// })

// router.delete('/albums/:id', (req, res) => {
//     console.log('delete this album')
// })


module.exports = router