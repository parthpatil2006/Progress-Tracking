const QUOTES = [
  "Small steps every day build extraordinary lives.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future self is watching you through your memories.",
  "Every day you do not complete your habits, your future city waits.",
  "One more brick. One more day. The city grows.",
  "Progress is not an accident — it is a decision made daily.",
  "You do not rise to the level of your goals; you fall to the level of your systems.",
  "The secret of your future is hidden in your daily routine.",
  "Motivation gets you started. Habit keeps you going.",
  "Each morning we are born again. What we do today matters most.",
  "Success is the sum of small efforts repeated day in and day out.",
  "You are what you repeatedly do. Excellence is not an act, but a habit.",
  "Be consistent. Even on the days it feels impossible.",
  "Champions keep playing until they get it right.",
  "The best investment you can make is in yourself.",
  "Do not wait. The time will never be just right. Start now.",
  "Every action you take is a vote for the person you want to become.",
  "A year from now you will wish you had started today.",
  "Your habits shape your identity, and your identity shapes your habits.",
  "Fall in love with the process, and the results will come.",
  "The pain of discipline is less than the pain of regret.",
  "Build something worth living in — starting with yourself.",
  "Your city of habits is built one day at a time.",
  "Hard work beats talent when talent does not work hard.",
  "Showing up is 80% of life. Be consistent. Be present.",
  "Dreams do not work unless you do.",
  "The only way to do great work is to love what you do — or commit to it.",
  "Brick by brick, day by day, the skyline rises.",
  "You have exactly the habits you have chosen. Choose better ones.",
  "Consistency creates momentum. Momentum creates results.",
];

function getDailyQuote() {
  const idx = dayOfYear(todayStr()) % QUOTES.length;
  return QUOTES[idx];
}
