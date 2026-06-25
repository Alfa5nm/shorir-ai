const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/features/exercise-library/exerciseGuides.ts');
let content = fs.readFileSync(filePath, 'utf8');

// A quick list of words that often imply a slightly more advanced exercise
const advancedKeywords = ["barbell", "decline", "incline", "deadlift", "overhead", "kettlebell", "smith machine"];

// We will use a regex to replace "intermediate" with "beginner" based on some logic,
// But since it's a TS file with stringified objects, we can just replace all of them
// manually or parse and re-stringify.
// Let's just do a string replacement on the file content.
// Wait, the file is formatted. Let's just read the JSON part using a regex, or simpler:
// Since I generated the file, I can just use eval or new Function to get the array.

const dataStr = content.match(/export const exerciseGuides: ExerciseGuide\[\] = (\[[\s\S]*\]);/)[1];
const data = eval(dataStr);

data.forEach(ex => {
  const name = ex.nameEn.toLowerCase();
  const isIntermediate = advancedKeywords.some(keyword => name.includes(keyword));
  ex.difficulty = isIntermediate ? "intermediate" : "beginner";
});

const newContent = content.replace(
  /export const exerciseGuides: ExerciseGuide\[\] = \[[\s\S]*\];/,
  \`export const exerciseGuides: ExerciseGuide[] = \${JSON.stringify(data, null, 2)};\`
);

fs.writeFileSync(filePath, newContent);
console.log("Updated difficulty levels for 30 exercises.");
