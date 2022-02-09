// NPM modules
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';

// local modules
import { User } from '../models/user.mjs';
import { auth } from '../middleware/auth.mjs';
import { sendWelcomeEmail, goodbyeEmail } from '../emails/accounts.mjs';

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|)$/)) {
            return cb(new Error('File must be an image!'));
        }

        cb (undefined, true)
    }
});

var router = express.Router();

// Creating New User/Sign Up
router.post('/users', async (req, res) => {
    console.log(req.body);
    
    const user = await new User(req.body);

    const unique = await User.findOne({ 
        email: req.body.email
    });
    
    if (unique == null) {
        try {
            await user.save();
            sendWelcomeEmail(user.email, user.name);
            const token = await user.generateToken();
            res.status(201).send({ user, token });
        } catch(err) {
            res.status(400).send(err.message);
        }    
    } else {
        console.log('A user with this email already exists!');
        res.status(400).send('A user with this email already exists!');
    }
});

// User Login
router.post('/users/login', async (req, res) => {
    const user = await User.findByCredentials(req.body.email, req.body.password);

    if ('error' in  user) {        
        console.log(user);
        res.status(400).send(user);
    } else {
        try {
            const token = await user.generateToken();
            console.log('TOKEN: ', token);
            res.send({ user, token });
        } catch(err) {
            res.status(400).send(err.message);
        }
    }
});

// User Logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token != req.token;
        });

        await req.user.save();

        res.send('Successfully Logged Out...');
    } catch (err) {
        res.status(500).send(err);
    }
});

// Logout User from all Devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();

        res.send('Successfully logged out of all devices...');
    } catch (err) {
        res.status(500).send(err);
    }
});

// Fetching User Profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

// Update a User
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({
            error: "Invalid Updates!"
        });
    }

    try {
        // const user = await User.findByIdAndUpdate(_id, body, { 
        //     new: true,
        //     runValidators: true
        // });

        updates.forEach((update) => req.user[update] = req.body[update]);

        await req.user.save();

        console.log(req.user);

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e.message);
    }
});

// Delete User
router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        await req.user.remove();
        goodbyeEmail(req.user.email, req.user.name);

        console.log('Deleted User:, ', req.user);

        res.send({
            deleted_user: req.user
        });
    } catch (e) {
        res.status(400).send(e);
    }
});

// Upload/Updating User Avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const sharpImageBuffer = await sharp(req.file.buffer)
    .resize(300, 300)
    .png()
    .toBuffer();

    req.user.avatar = sharpImageBuffer;

    req.user.save();

    res.send('Profile picture uploaded successfully...');
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    });
});

// Delete User Avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();

    res.send('Profile picture deleted successfully...');
}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    });
});

// Fetching Avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error('User/Avatar not found!');
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (err) {
        res.status(400).send('Couldn\'t fetch user avatar...');
    }
});

var userRouter = router;

export { userRouter };