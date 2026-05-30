const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = "863f7ac04d5924f870d9041183bc1febcc1c5543b5ce5fbf2c2a122e9bfd70e7160fb2496c79a1ccd2d73383740d7f45a78dba1d8911128957d4f3d4e63b8ef9";
const userId = "6a16a7438109b8d21fa68f2d";
const projectId = "6a1a7f19ca42c5b5c44df20b";

// Generate JWT token
const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });

async function trigger() {
  try {
    console.log("Sending GET request to local API...");
    const res = await axios.get(`http://localhost:3000/api/projects/${projectId}/characters`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("SUCCESS! Response status:", res.status);
    console.log("Response data:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("FAILED! Status:", err.response?.status);
    console.log("Error details:", err.response?.data);
  }
}

trigger();
