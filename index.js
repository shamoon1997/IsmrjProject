const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { propertyData } = require('./propertyData');
const { getCurrentPacificTime, addOneDayAndSetThreePM } = require('./utils');

const updatePropertyStatus = async (req, res) => {
  console.log('running cron job');
  try {
    const currentPacificTime = getCurrentPacificTime();
    const properties = await Property.find();

    for (const property of properties) {
      if (new Date(currentPacificTime) >= new Date(property.remainingTime)) {
        // Update property status to available
        await Property.findOneAndUpdate(
          { propertyId: property },
          {
            $unset: {
              remainingTime: 1,
              reservedOn: 1,
              reservedBy: 1,
            },
            $set: {
              status: 'Available',
              lastUpdate: getCurrentPacificTime(),
            },
          }
        );
        console.log(
          `Property ${property.propertyId} status updated to Available`
        );
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'status updated',
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    return res.status(500).json({
      status: 500,
      message: 'status failed',
    });
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use('/cron', updatePropertyStatus);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Connect to MongoDB
// mongodb+srv://shamoon1997:mongodbatlas123@mongopracticestart.vdf7o.mongodb.net/bnbtest?retryWrites=true&w=majority
mongoose.connect(
  'mongodb+srv://shamoon1997:mongodbatlas123@mongopracticestart.vdf7o.mongodb.net/bnbtest?retryWrites=true&w=majority',
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
    const reservedProperties = properties.filter(
      (property) => property.status.toString().toLowerCase() === 'reserved'
    );

    const soldProperties = properties.filter(
      (property) => property.status.toString().toLowerCase() === 'sold'
    );

    const availableProperties = properties.filter(
      (property) => property.status.toString().toLowerCase() === 'available'
    );

    const lockedProperties = properties.filter(
      (property) => property.status.toString().toLowerCase() === 'locked'
    );

    res.render('index', {
      data: [
        ...reservedProperties,
        ...soldProperties,
        ...availableProperties,
        ...lockedProperties,
      ],
      NumberofReserved: reservedProperties.length,
      NumberofAvailable: availableProperties.length,
      NumberofSold: soldProperties.length,
      NumberofLocked: lockedProperties.length,
    });
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
      const foundProperty = await Property.findOne({ propertyId: property });
      if (foundProperty.status.toString().toLowerCase() == 'reserved') {
        if (new_status == 'Sold' || new_status == 'Available') {
          await Property.findOneAndUpdate(
            { propertyId: property },
            {
              $unset: {
                remainingTime: 1,
                reservedOn: 1,
                reservedBy: 1,
              },
              $set: {
                status: new_status,
                lastUpdate: getCurrentPacificTime(),
              },
            }
          );
        } else {
          return res.status(400).json({
            status: 400,
            message: 'rejected',
          });
        }
      } else {
        await Property.findOneAndUpdate(
          { propertyId: property },
          {
            $unset: {
              remainingTime: 1,
              reservedOn: 1,
              reservedBy: 1,
            },
            $set: {
              status: new_status,
              lastUpdate: getCurrentPacificTime(),
            },
          }
        );
      }
    }
    return res.status(200).json({
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
});
