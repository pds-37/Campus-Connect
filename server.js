
// server.js
// This is the backend for the College Connect Hub application.

// --- IMPORTS ---
// Import Express to create the server, cors for cross-origin requests,
// and multer for handling file uploads.
const express = require('express');
const cors = require('cors');
const multer = require('multer');

// Import Firebase Admin SDK for backend communication with Firebase services.
const admin = require('firebase-admin');

// --- FIREBASE SETUP ---
// You must download your Firebase service account key JSON file and place it
// in the same directory as this server.js file.
// Rename the file to 'serviceAccountKey.json'.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "lost-and-found-451b9.firebasestorage.app" // IMPORTANT: Replace with your Firebase Storage bucket URL (e.g., your-project-id.appspot.com)
});

// Initialize Firestore database and Storage bucket.
const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- EXPRESS APP SETUP ---
const app = express();
const port = 3000; // The port the server will run on.

// --- MIDDLEWARE ---
// Use cors to allow the frontend (running on a different port) to access the API.
app.use(cors());
// Use express.json() to parse incoming JSON request bodies.
app.use(express.json());

// Configure multer for in-memory file storage. This temporarily holds the
// uploaded file before we send it to Firebase Storage.
const upload = multer({ storage: multer.memoryStorage() });


// --- API ENDPOINTS ---

// == AUTHENTICATION ==
// Endpoint for user login.
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const usersRef = db.collection('users');
    // Find a user with the matching username and password.
    const snapshot = await usersRef.where('username', '==', username).where('password', '==', password).limit(1).get();

    if (snapshot.empty) {
      // If no user is found, return a 401 Unauthorized error.
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    let user;
    snapshot.forEach(doc => {
      user = { id: doc.id, ...doc.data() };
    });
    
    // Send back the user data on successful login.
    res.status(200).json(user);
  } catch (error) {
    // Improved error logging to help diagnose issues like missing indexes.
    console.error("Login error:", error.message);
    if (error.code === 9 || error.code === 'FAILED_PRECONDITION') { // 'FAILED_PRECONDITION' error code for missing index
        console.error("This error almost always means you are missing a Firestore composite index for the 'users' collection. Please check the error message in the console for a link to create one automatically, or follow the setup instructions to create it manually.");
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// == FOUND ITEMS ==
// Endpoint to get all items from the "foundItems" collection.
app.get('/found-items', async (req, res) => {
    try {
        const snapshot = await db.collection('foundItems').orderBy('date', 'desc').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(items);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Endpoint for an admin to upload a new found item.
// The 'upload.single('image')' middleware handles the file upload.
app.post('/found-items', upload.single('image'), async (req, res) => {
    try {
        const { name, category, location, date } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).send('No image file uploaded.');
        }

        // Create a unique filename for the uploaded image.
        const fileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        // Create a stream to upload the file to Firebase Storage.
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            console.error(error);
            res.status(500).send({ message: "Error uploading file." });
        });

        blobStream.on('finish', async () => {
            // Make the file public and get its URL.
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            // Create a new document in the "foundItems" collection with the item data and image URL.
            const docRef = await db.collection('foundItems').add({
                name,
                category,
                location,
                date,
                img: publicUrl,
            });
            res.status(201).json({ id: docRef.id, name, category, location, date, img: publicUrl });
        });

        // End the stream with the file's buffer.
        blobStream.end(file.buffer);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


// == LOST ITEM REPORTS ==
// Endpoint to get all reports from the "lostReports" collection.
app.get('/lost-reports', async (req, res) => {
    try {
        const snapshot = await db.collection('lostReports').orderBy('id', 'desc').get();
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Endpoint for a student to submit a new lost item report.
app.post('/lost-reports', async (req, res) => {
    try {
        const newReport = req.body;
        // Add a server-side timestamp to the report.
        newReport.id = Date.now(); 
        const docRef = await db.collection('lostReports').add(newReport);
        res.status(201).json({ id: docRef.id, ...newReport });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


// == MESSAGES ==
// Endpoint to get all messages from the "messages" collection.
app.get('/messages', async (req, res) => {
    try {
        const snapshot = await db.collection('messages').orderBy('date', 'desc').get();
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Endpoint for an admin to create a new message.
app.post('/messages', async (req, res) => {
    try {
        const newMessage = req.body;
        // Add a server-side timestamp to the message.
        newMessage.date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = await db.collection('messages').add(newMessage);
        res.status(201).json({ id: docRef.id, ...newMessage });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


// --- START SERVER ---
// Start the Express server and listen for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`College Connect Hub backend listening at http://localhost:${port}`);
});
