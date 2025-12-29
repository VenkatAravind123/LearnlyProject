function validateQuestions(questions) {
  if (!Array.isArray(questions)) return false;

  return questions.every(q =>
    q.questionText &&
    q.optionA &&
    q.optionB &&
    q.optionC &&
    q.optionD &&
    ["A", "B", "C", "D"].includes(q.correctOption)
  );
}

module.exports = validateQuestions;
