const express = require('express');
const mailRoutes = require('./routes/mailRoutes');
const templateRoutes = require('./routes/templateRoutes');
const cors = require('cors');

const app = express();

// Allow larger request bodies (e.g., 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors({
    origin: '*', // Allow all origins, adjust as needed for security
    methods: 'GET,POST,PUT,DELETE', // Allow specific methods
    allowedHeaders: 'Content-Type'
}))

app.use('/api/mail', mailRoutes);
app.use('/api/templates', templateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
