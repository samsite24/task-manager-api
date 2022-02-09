import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { Task } from './task.mjs';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        validate(value) {
            if ( validator.isEmpty(value) ) {
                throw new Error('Name cannot be an empty string!');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be greater than 0');
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if ( !validator.isEmail(value) ) {
                throw new Error('Email must be valid!');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        // minLength: 7,
        validate(value) {
            if ( validator.contains(value.toLowerCase(), 'password') ) {
                throw new Error('Password cannot contain string \'password\'');
            } else if ( !validator.isLength(value, 7) ) {
                throw new Error('Password must be at least 6 characters');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// Virtual Property
// (defines a relationship b/w 2 entities, eg. User & Task)
UserSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

// Get Public Profile of User
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// Generate Token for Authorized User
UserSchema.methods.generateToken = async function() {
    // Schema 'methods' are accessible on the instances {Instance Methods}
    const user = this;

    var token = jwt.sign({
        _id: user._id.toString()
    }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });

    await user.save();
    return token;
}

// Find User to Log in
UserSchema.statics.findByCredentials = async (email, password) => {
    // Schema 'statics' are accessible on the models (Model Mehods)
    const user = await User.findOne({ email });

    if (!user) {
        return ({
            error: 'Unable to login!'
        });
    }

    return bcrypt.compare(password, user.password)
    .then((result) => {
        if (result) {
            console.log(user);
            return user;
        } else {
            return ({
                "error": "Unable to login!"
            });
        }
    })
    .catch((err) => {
        console.log(err);
        return ({
            "error": err
        });
    });
}

// Hashing User Password
UserSchema.pre('save', async function (next) {
    // normal fns give access to 'this' keyword
    const user = this;

    if (user.isModified('password')) {
        await bcrypt.hash(user.password, 8)
        .then((hash) => {
            user.password = hash;
            console.log(`Password (HASHED): ${user.password}`);
        })
        .catch((err) => {
            console.log(err);
        });
    }

    next();
});

// Deleting tasks of deleted users
UserSchema.pre('remove', async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', UserSchema);

export { User };