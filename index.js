// Require the 'app' module from the current directory (assuming it's a Node.js application)
const app = require('./app');

// Start the server and listen for incoming requests on port 3000
app.listen(3000, () => {
    console.log('App is listening on port 3000'); // Log a message when the server starts listening
});
