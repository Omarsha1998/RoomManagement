const calculateMillisecondsUntil = function (hour, minute) {
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
  );
  let delay = targetTime - now;
  if (delay < 0) {
    // If the target time is in the past, schedule it for the next day
    delay += 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }
  return delay;
};
const scheduleDailyTask = function (hour, minute, task) {
  const initialDelay = calculateMillisecondsUntil(hour, minute);
  setTimeout(function () {
    task();
    setInterval(task, 24 * 60 * 60 * 1000);
  }, initialDelay);
};

module.exports = {
  scheduleDailyTask,
};
