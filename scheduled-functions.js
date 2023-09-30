const { getCurrentPacificTime } = require('./utils');
const { Property } = require('./index');

const updatePropertyStatus = async () => {
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
  } catch (error) {
    console.error('Error updating property status:', error);
  }
};
