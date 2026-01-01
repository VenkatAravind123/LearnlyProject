function validateFlashcards(cards) {
  if (!Array.isArray(cards)) return false;
  return cards.every(
    (c) =>
      typeof c?.front === "string" &&
      c.front.trim() &&
      typeof c?.back === "string" &&
      c.back.trim()
  );
}

module.exports = validateFlashcards;