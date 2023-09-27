function getCurrentPacificTime() {
  const pacificTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: true,
  });

  return pacificTime;
}

function addOneDayAndSetThreePM(pacificTime) {
  const nextDay = new Date(pacificTime);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(18, 0, 0, 0); // Set the time to 3 PM

  return nextDay.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: true,
  });
}

module.exports = {
  getCurrentPacificTime,
  addOneDayAndSetThreePM,
};
