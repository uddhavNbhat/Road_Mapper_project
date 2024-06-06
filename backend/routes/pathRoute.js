const express = require('express');
const pathRoute = express.Router();
const Pin = require('../pinlocationSchema');
const { dijkstra, buildGraph, getShortestPath } = require('../utils/shortestPath');

pathRoute.get('/shortest-path', async (req, res) => {
    try {
        const pins = await Pin.find();
        const graph = buildGraph(pins);

        const startPinId = req.query.start;
        const endPinId = req.query.end;

        const { previous } = dijkstra(graph, startPinId);
        const path = getShortestPath(previous, endPinId);

        const route = path.map(pinId => pins.find(p => p._id.toString() === pinId));

        res.status(200).json({ route });
    } catch (error) {
        console.error('Error calculating shortest path:', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});

module.exports = pathRoute;
