const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const { propertyData } = require('./propertyData');
const { getCurrentPacificTime, addOneDayAndSetThreePM } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Connect to MongoDB
mongoose.connect(
  'mongodb+srv://shamoon1997:mongodbatlas123@mongopracticestart.vdf7o.mongodb.net/MJTest?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  insertPropertyData();
});

// Define a MongoDB schema and model (example)
const propertySchema = new mongoose.Schema({
  propertyId: String,
  status: String,
  reservedOn: String,
  reservedBy: String,
  remainingTime: String,
  lastUpdate: String,
});

const Property = mongoose.model('Property', propertySchema);

const insertPropertyData = async () => {
  try {
    // Check if each property already exists and insert if not
    for (const propertyInfo of propertyData) {
      const existingProperty = await Property.findOne({
        propertyId: propertyInfo.propertyId,
      });

      if (!existingProperty) {
        const property = new Property(propertyInfo);
        await property.save();
        console.log(`Property inserted: ${propertyInfo.propertyId}`);
      } else {
        console.log(`Property already exists: ${propertyInfo.propertyId}`);
      }
    }
  } catch (error) {
    console.error('Error inserting property data:', error);
  }
};

app.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    res.render('index', { data: properties });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'failure',
    });
  }
});

app.post('/api', async (req, res) => {
  const { property, new_status, user } = req.body;
  try {
    if (new_status.toString().toLowerCase() === 'reserved') {
      const currentPacificTime = getCurrentPacificTime();
      await Property.findOneAndUpdate(
        { propertyId: property },
        {
          status: new_status,
          reservedBy: user,
          reservedOn: getCurrentPacificTime(),
          lastUpdate: getCurrentPacificTime(),
          remainingTime: addOneDayAndSetThreePM(currentPacificTime),
        }
      );
    } else {
      await Property.findOneAndUpdate(
        { propertyId: property },
        {
          status: new_status,
          lastUpdate: getCurrentPacificTime(),
        }
      );
    }
    res.status(200).json({
      status: 200,
      message: 'success',
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Schedule a cron job to run every two minutes
  cron.schedule('*/2 * * * *', async () => {
    console.log('Running cron job...');
    await updatePropertyStatus();
  });
});

const updatePropertyStatus = async () => {
  try {
    const currentPacificTime = getCurrentPacificTime();
    const properties = await Property.find();

    for (const property of properties) {
      if (new Date(currentPacificTime) >= new Date(property.remainingTime)) {
        // Update property status to available
        await Property.findOneAndUpdate(
          { propertyId: property.propertyId },
          { status: 'Available' }
        );
        console.log(
          `Property ${property.propertyId} status updated to Available`
        );
      }
    }
  } catch (error) {
    console.error('Error updating property status:', error);
  }
};