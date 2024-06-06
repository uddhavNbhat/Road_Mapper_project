const { haversineDistance } = require('./distance');

const dijkstra = (graph, startNode) => {
    const distances = {};
    const visited = new Set();
    const previous = {};

    distances[startNode] = 0;

    while (Object.keys(distances).length > 0) {
        const currentNode = Object.keys(distances).reduce((minNode, node) =>
            distances[node] < distances[minNode] ? node : minNode
        );

        const currentDistance = distances[currentNode];
        delete distances[currentNode];
        visited.add(currentNode);

        const neighbors = graph[currentNode];
        for (const neighbor in neighbors) {
            if (!visited.has(neighbor)) {
                const newDist = currentDistance + neighbors[neighbor];
                if (!distances[neighbor] || newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previous[neighbor] = currentNode;
                }
            }
        }
    }

    return { distances, previous };
};

const buildGraph = (pins) => {
    const graph = {};
    pins.forEach((pin, index) => {
        graph[pin._id] = {};
        pins.forEach((otherPin, otherIndex) => {
            if (index !== otherIndex) {
                const distance = haversineDistance([pin.latitude, pin.longitude], [otherPin.latitude, otherPin.longitude]);
                graph[pin._id][otherPin._id] = distance;
            }
        });
    });
    return graph;
};

const getShortestPath = (previous, endNode) => {
    const path = [];
    let currentNode = endNode;
    while (currentNode) {
        path.unshift(currentNode);
        currentNode = previous[currentNode];
    }
    return path;
};

module.exports = { dijkstra, buildGraph, getShortestPath };
