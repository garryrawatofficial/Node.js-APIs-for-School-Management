
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "school_management",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

app.post("/addSchool", (req, res) => {
    const { name, address, latitude, longitude } = req.body;
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: "All fields are required." });
    }
    const query = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to add school." });
        }
        res.status(201).json({ message: "School added successfully.", schoolId: result.insertId });
    });
});

app.get("/listSchools", (req, res) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const query = "SELECT * FROM schools";

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch schools." });
        }

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const toRad = (value) => (value * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) *
                    Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
            return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        };

        const sortedSchools = results.map((school) => ({
            ...school,
            distance: calculateDistance(userLat, userLon, school.latitude, school.longitude),
        })).sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
