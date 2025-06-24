// parsePracticeExams.js
// Usage: node parsePracticeExams.js
// This script extracts all questions and answers from practice-exam/*.md and writes them to questionsAnswers.js

const fs = require('fs/promises');
const path = require('path');

const PRACTICE_EXAM_DIR = path.join(__dirname, 'practice-exam');
const OUTPUT_FILE = path.join(__dirname, 'questionsAnswers.js');
const QUESTION_REGEX = /^(\d+)\. (.*?)(?=\n\s*- A\.|\n\d+\.|\n<details|$)/gs;
const CHOICE_REGEX = /\n\s*- [A-E]\. .*/g;
const ANSWER_REGEX = /<details[\s\S]*?Correct answer: ([^\n<]*)/i;

async function getExamFiles() {
  const files = await fs.readdir(PRACTICE_EXAM_DIR);
  return files.filter(f => /^practice-exam-\d+\.md$/.test(f));
}

async function extractQuestionsAndAnswers() {
  const files = await getExamFiles();
  let questions = [];
  let answers = [];

  for (const file of files.sort()) {
    const content = await fs.readFile(path.join(PRACTICE_EXAM_DIR, file), 'utf8');
    // Split by question number
    const parts = content.split(/\n(?=\d+\. )/g).slice(1); // skip header
    for (const part of parts) {
      // Extract question text (up to <details)
      const qMatch = part.match(/^(\d+)\.([\s\S]*?)(?=<details|$)/);
      if (!qMatch) continue;
      let qText = qMatch[2].trim();
      // Extract choices
      const choices = qText.match(CHOICE_REGEX);
      let question = qText;
      if (choices) {
        // Remove choices from question stem
        question = qText.replace(CHOICE_REGEX, '').trim() + '\n' + choices.join('\n');
      }
      question = question.replace(/\n{2,}/g, '\n').trim();
      // Extract answer
      const aMatch = part.match(ANSWER_REGEX);
      if (!aMatch) continue;
      let answer = aMatch[1].trim();
      questions.push(question);
      answers.push(answer);
    }
  }
  return { questions, answers };
}

async function writeOutput(questions, answers) {
  const fileContent =
    `const questions = ${JSON.stringify(questions, null, 2)};
const answers = ${JSON.stringify(answers, null, 2)};
`;
  await fs.writeFile(OUTPUT_FILE, fileContent, 'utf8');
  console.log(`Wrote ${questions.length} questions and answers to questionsAnswers.js`);
}

(async () => {
  const { questions, answers } = await extractQuestionsAndAnswers();
  await writeOutput(questions, answers);
})(); 