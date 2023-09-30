function getCurrentPacificTime() {
  const pacificTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: true,
  });

  return pacificTime;
}

function addOneDayAndSetThreePM() {
  // Get the current date and time in Pacific Time (PT)
  const pacificTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
  });

  // Convert the string to a Date object
  const pacificDateTime = new Date(pacificTime);

  // Add one day
  pacificDateTime.setDate(pacificDateTime.getDate() + 1);

  // Set the time to 3 PM
  pacificDateTime.setHours(21, 0, 0, 0);

  // Convert the updated date to a string in the desired format
  const result = pacificDateTime.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
  });

  console.log('result: ', result);
  return result;
}
module.exports = {
  getCurrentPacificTime,
  addOneDayAndSetThreePM,
};
