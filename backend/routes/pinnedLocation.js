const express = require('express');
const pinroute = express.Router();
const Pin = require("../pinlocationSchema");

pinroute.route("/").post(async (req, res) => {
    const newPin = new Pin(req.body);
    try {
        const savedPin = await newPin.save();
        res.status(200).json(savedPin);
    } catch (error) {
        console.error('Error saving pin:', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
}).get(async (req, res) => {
    try {
        const pins = await Pin.find();
        res.status(200).json(pins);
    } catch (error) {
        console.error('Error fetching pins:', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});

module.exports = pinroute;
