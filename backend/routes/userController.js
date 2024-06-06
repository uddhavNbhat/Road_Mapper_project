const express = require('express');
const userroute = express.Router();
const User = require("../userSchema");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


userroute.route("/signup").post(async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
        });

        const user = await newUser.save();
        res.status(200).json(user.username);
    } catch (error) {
        console.error("Error in /signup route:", error);
        res.status(500).json("Internal Server Error");
    }
});

userroute.route("/login").post(async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json("Username and password are required");
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json("Wrong Username or Password");
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json("Wrong Username or Password");
        }

        else{
        const token = jwt.sign({ _id: user._id, username }, 'Map_Token', { expiresIn: '1h' });
        res.status(200).json({ token, username });
        }
    } catch (error) {
        console.error("Error in /login route:", error);
        res.status(500).json("Internal Server Error");
    }
});


module.exports = userroute;
