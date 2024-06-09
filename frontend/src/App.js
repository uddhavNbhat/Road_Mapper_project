import './App.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import RoomIcon from '@mui/icons-material/Room';
import StarRateIcon from '@mui/icons-material/StarRate';
import axios from "axios";
import { format } from 'timeago.js';
import Login from './components/Login';
import Register from './components/Register';
import mapboxSdk from '@mapbox/mapbox-sdk';
import mapboxDirections from '@mapbox/mapbox-sdk/services/directions';

const baseClient = mapboxSdk({ accessToken: 'pk.eyJ1IjoidWRkaGF2LTEyMzQiLCJhIjoiY2x2ajV1cG9hMWkwcTJxbzR1bXhrZTVjdCJ9.cuOWEW7TyoJNznIkkzx9lw' });
const directionsClient = mapboxDirections(baseClient);

function App() {
    const myStorage = window.localStorage;
    const [viewState, setViewState] = useState({
        longitude: 78.9629,
        latitude: 20.5937,
        zoom: 4
    });

    const [currentUser, setCurrentUser] = useState(myStorage.getItem("user") || null);
    const [showPopup, setShowPopup] = useState(true);
    const [pins, setPins] = useState([]);
    const [newPlace, setNewPlace] = useState(null);
    const [title, setTitle] = useState(null);
    const [desc, setDesc] = useState(null);
    const [rating, setRating] = useState(0);
    const [currentPlaceId, setCurrentPlaceId] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [route, setRoute] = useState(null);
    const [startLocation, setStartLocation] = useState(null);
    const [endLocation, setEndLocation] = useState(null);
    const [intermediatePoints, setIntermediatePoints] = useState([]);
    const [showMaxDistanceError, setShowMaxDistanceError] = useState(false);
    const [showNoRouteFoundError, setShowNoRouteFoundError] = useState(false);

    useEffect(() => {
        const getPins = async () => {
            try {
                const allPins = await axios.get("http://localhost:4050/pinnedLocation", {
                    headers: {
                        'Authorization': myStorage.getItem("token")
                    }
                });
                setPins(allPins.data);
            } catch (err) {
                console.log(err);
            }
        };
        getPins();
    }, []);

    const fetchShortestPath = async (startCoords, intermediateCoords, endCoords) => {
        try {
            const waypoints = [
                { coordinates: startCoords },
                ...intermediateCoords.map(coords => ({ coordinates: coords })),
                { coordinates: endCoords }
            ];
            const response = await directionsClient.getDirections({
                waypoints,
                profile: 'driving-traffic',
                geometries: 'geojson'
            }).send();
            const directionsData = response.body.routes[0];
            if (!directionsData) {
                console.error('No route found.');
                setRoute(null);
                setShowNoRouteFoundError(true);
            } else {
                console.log('Route data:', directionsData.geometry.coordinates);
                setRoute(directionsData.geometry);
            }
        } catch (err) {
            console.log(err);
            if (err.message.includes("Max distance exceeded")) {
                setShowMaxDistanceError(true);
            }
        }
    };

    const handleAddIntermediatePoint = (pointId) => {
        const point = pins.find(p => p._id === pointId);
        if (point) {
            // Exclude source and destination points from being added as intermediate points
            if (point._id !== startLocation && point._id !== endLocation) {
                // Assign priority based on the current number of intermediate points
                const priority = intermediatePoints.length + 1;
                setIntermediatePoints([...intermediatePoints, { ...point, priority }]);
            }
        }
    };
    const handleRemoveIntermediatePoint = (pointId) => {
        // Remove the point with the specified ID
        setIntermediatePoints(intermediatePoints.filter(p => p._id !== pointId));
        // Update priorities of remaining intermediate points
        const updatedIntermediatePoints = intermediatePoints
            .filter(p => p._id !== pointId)
            .map((point, index) => ({
                ...point,
                priority: index + 1
            }));
        setIntermediatePoints(updatedIntermediatePoints);
    };

    const handleMarkerClick = (id, lat, long) => {
        setCurrentPlaceId(id);
        setViewState({ ...viewState, latitude: lat, longitude: long });
        setShowPopup(true);
    };

    const handleAddClick = (e) => {
        const lat = e.lngLat.lat;
        const long = e.lngLat.lng;
        setNewPlace({
            lat,
            long
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newPin = {
            username: currentUser,
            title,
            description: desc,
            rating: Number(rating),
            latitude: newPlace.lat,
            longitude: newPlace.long,
        };
        console.log('Submitting new pin:', newPin);
        try {
            const res = await axios.post("http://localhost:4050/pinnedLocation", newPin, {
                headers: {
                    'Authorization': myStorage.getItem("token")
                }
            });
            setPins([...pins, res.data]);
            setNewPlace(null);
        } catch (err) {
            console.log(err);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        myStorage.removeItem("user");
        myStorage.removeItem("token");
    };

    const getRouteGeoJSON = () => {
        if (!route) return null;

        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: route,
                    properties: {}
                }
            ]
        };
    };

    const handleSearch = () => {
        if (startLocation && endLocation) {
            const startPin = pins.find(p => p._id === startLocation);
            const endPin = pins.find(p => p._id === endLocation);
            const intermediateCoords = intermediatePoints.map(p => [p.longitude, p.latitude]);
            if (startPin && endPin) {
                fetchShortestPath([startPin.longitude, startPin.latitude], intermediateCoords, [endPin.longitude, endPin.latitude]);
            }
        }
    };

    return (
        <div className='map-container'>
            <div className='search-bar'>
    <select onChange={(e) => setStartLocation(e.target.value)} defaultValue="">
        <option value="" disabled>Select Start Location</option>
        {pins.map(p => (
            <option key={p._id} value={p._id}>{p.title}</option>
        ))}
    </select>
    <select onChange={(e) => setEndLocation(e.target.value)} defaultValue="">
        <option value="" disabled>Select End Location</option>
        {pins.map(p => (
            <option key={p._id} value={p._id}>{p.title}</option>
        ))}
    </select>
    <div className="intermediate-points">
        <div className="intermediate-points-title">Intermediate Points:</div>
        {pins.map(p => (
            (p._id !== startLocation && p._id !== endLocation) && (
                <div key={p._id} className="intermediate-point">
                    <label>
                        <input
                            type="checkbox"
                            onChange={(e) => e.target.checked ? handleAddIntermediatePoint(p._id) : handleRemoveIntermediatePoint(p._id)}
                        />
                        <span className="intermediate-point-title">{p.title}</span>
                    </label>
                </div>
            )
        ))}
    </div>
    <button onClick={handleSearch} style={{ color: "slateblue", borderRadius: "3px" }}>Show Path</button>
</div>

            <Map
                {...viewState}
                mapboxAccessToken='pk.eyJ1IjoidWRkaGF2LTEyMzQiLCJhIjoiY2x2ajV1cG9hMWkwcTJxbzR1bXhrZTVjdCJ9.cuOWEW7TyoJNznIkkzx9lw'
                mapStyle="mapbox://styles/mapbox/streets-v11"
                onMove={evt => setViewState(evt.viewState)}
                touchZoomRotate={true}
                onDblClick={handleAddClick}
            >
                {pins.map(p => (
                    <React.Fragment key={p._id}>
                        <Marker
                            latitude={p.latitude}
                            longitude={p.longitude}
                            anchor="bottom"
                        >
                            <div style={{ color: 'red' }}>
                                <RoomIcon
                                    style={{ cursor: "pointer", color: p.username === currentUser ? "tomato" : "magenta" }}
                                    onClick={() => handleMarkerClick(p._id, p.latitude, p.longitude)}
                                />
                            </div>
                        </Marker>
                        {p._id === currentPlaceId && (
                            showPopup && (
                                <Popup
                                    longitude={p.longitude}
                                    latitude={p.latitude}
                                    anchor="bottom"
                                    closeButton={true}
                                    closeOnClick={false}
                                    onClose={() => setCurrentPlaceId(null)}
                                >
                                    <div className='card'>
                                        <label>Place</label>
                                        <h4 className='place'>{p.title}</h4>
                                        <label>Review</label>
                                        <p className='desc'>{p.description}</p>
                                        <label>Rating</label>
                                        <div className='star'>
                                            {Array(p.rating).fill(<StarRateIcon />)}
                                        </div>
                                        <label>Information</label>
                                        <span className='username'>Created by <b>{p.username}</b></span>
                                        <span className='date'>{format(p.createdAt)}</span>
                                    </div>
                                </Popup>
                            )
                        )}
                    </React.Fragment>
                ))}

                {newPlace && (
                    <Popup
                        longitude={newPlace.long}
                        latitude={newPlace.lat}
                        anchor="bottom"
                        closeButton={true}
                        closeOnClick={false}
                        onClose={() => setNewPlace(null)}
                    >
                        <div>
                            <form onSubmit={handleSubmit}>
                                <label>Title</label>
                                <input placeholder='Enter a Title' value={title} onChange={(e) => setTitle(e.target.value)} />
                                <label>Review</label>
                                <textarea placeholder='Any Words about the Place?' value={desc} onChange={(e) => setDesc(e.target.value)} />
                                <label>Rating</label>
                                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                                <button className='submitButton' type='submit'>Add Pin</button>
                            </form>
                        </div>
                    </Popup>
                )}
                {route && (
                    <Source id="route" type="geojson" data={getRouteGeoJSON()}>
                        <Layer
                            id="route"
                            type="line"
                            paint={{
                                'line-color': 'blue',
                                'line-width': 3
                            }}
                        />
                    </Source>
                )}
                {showMaxDistanceError && (
                    <Popup
                        longitude={viewState.longitude}
                        latitude={viewState.latitude}
                        anchor="top"
                        closeButton={true}
                        closeOnClick={false}
                        onClose={() => setShowMaxDistanceError(false)}
                    >
                        <div className='error-popup'>
                            <p>Max distance exceeded. Please select closer points.</p>
                        </div>
                    </Popup>
                )}
                {showNoRouteFoundError && (
                    <Popup
                        longitude={viewState.longitude}
                        latitude={viewState.latitude}
                        anchor="top"
                        closeButton={true}
                        closeOnClick={false}
                        onClose={() => setShowNoRouteFoundError(false)}
                    >
                        <div className='error-popup'>
                            <p>No route found. Please select different points.</p>
                        </div>
                    </Popup>
                )}
                {currentUser ?
                    (<button className='button logout' onClick={handleLogout}>Logout</button>) :
                    (<div className='buttons'>
                        <button className='button login' onClick={() => setShowLogin(true)}>Login</button>
                        <button
                            className="button register"
                            onClick={() => setShowRegister(true)}
                        >
                            Register
                        </button>
                    </div>
                    )}
                {showRegister && <Register setShowRegister={setShowRegister} />}
                {showLogin && (
                    <Login
                        setShowLogin={setShowLogin}
                        setCurrentUser={setCurrentUser}
                        myStorage={myStorage}
                    />
                )}
            </Map>
        </div>
    );
}

export default App;
