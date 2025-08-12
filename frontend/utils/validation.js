export const isValidMeld = (meld, wildCard) => {
  try {
    if (meld.length < 3) return false;

    const ranks = [];
    const suits = [];
    let jokerCount = 0;

    const rankOrder = [
      "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
    ];

    // ✅ FIX: move this inside the function
    const wildValue = typeof wildCard === "string" ? wildCard : wildCard?.value;
    const wildCardRank = wildValue?.match(/^([SHDC])([A2-9JQK]|10)$/)?.[2];

    // ✅ Duplicate check fix
    const nonJokerCards = meld
      .map((card) => typeof card === "string" ? card : card?.value)
      .filter((value) => value !== "JOKER");

    const nonJokerSet = new Set(nonJokerCards);
    if (nonJokerSet.size !== nonJokerCards.length) return false;

    for (const card of meld) {
      const cardValue = typeof card === "string" ? card : card?.value;
      if (!cardValue) return false;

      if (cardValue === "JOKER") {
        jokerCount++;
        continue;
      }

      const match = cardValue.match(/^([SHDC])([A2-9JQK]|10)$/);
      if (!match) return false;

      const [, suit, rank] = match;

      if (rank === wildCardRank) {
        jokerCount++;
      } else {
        if (!rankOrder.includes(rank)) return false;
        ranks.push(rank);
        suits.push(suit);
      }
    }

    const uniqueRanks = new Set(ranks);
    const uniqueSuits = new Set(suits);

    // ✅ Set check
    const isSet =
      uniqueRanks.size === 1 &&
      suits.length === uniqueSuits.size &&
      uniqueSuits.size + jokerCount === meld.length &&
      (meld.length === 3 || meld.length === 4) &&
      ((meld.length === 3 && jokerCount <= 1) ||
        (meld.length === 4 && jokerCount <= 2));

    if (isSet) return true;

    // ✅ Run check
    if (
      uniqueSuits.size === 1 ||
      (uniqueSuits.size === 0 && jokerCount === meld.length)
    ) {
      const sortedIndices = ranks
        .map((r) => rankOrder.indexOf(r))
        .sort((a, b) => a - b);

      const isSpecialQKA =
        meld.length === 3 &&
        ranks.includes("Q") &&
        ranks.includes("K") &&
        ranks.includes("A") &&
        uniqueSuits.size === 1;

      if (isSpecialQKA) return true;

      const hasKA2 =
        ranks.includes("K") && ranks.includes("A") && ranks.includes("2");
      if (hasKA2) return false;

      let gaps = 0;
      for (let i = 1; i < sortedIndices.length; i++) {
        const diff = sortedIndices[i] - sortedIndices[i - 1];
        if (diff === 0) return false;
        if (diff > 1) gaps += diff - 1;
      }

      return gaps <= jokerCount;
    }

    return false;
  } catch (err) {
    console.error("Validation Error:", err);
    return false;
  }
};


// // src/utils/meldValidation.js
// export const isValidMeld = (meld, wildCard) => {
//   try {
//     if (meld.length < 3) return false;

//     const ranks = [];
//     const suits = [];
//     let jokerCount = 0;

//     const rankOrder = [
//       "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
//     ];

//     const wildCardRank = wildCard.match(/^([SHDC])([A2-9JQK]|10)$/)?.[2];

//     const nonJokerCards = meld.filter((card) => card !== "JOKER");
//     const nonJokerSet = new Set(nonJokerCards);
//     if (nonJokerSet.size !== nonJokerCards.length) return false;

//     for (const card of meld) {
//       if (card === "JOKER") {
//         jokerCount++;
//         continue;
//       }

//       const match = card.match(/^([SHDC])([A2-9JQK]|10)$/);
//       if (!match) return false;

//       const [, suit, rank] = match;

//       if (rank === wildCardRank) {
//         jokerCount++;
//       } else {
//         if (!rankOrder.includes(rank)) return false;
//         ranks.push(rank);
//         suits.push(suit);
//       }
//     }

//     const uniqueRanks = new Set(ranks);
//     const uniqueSuits = new Set(suits);

//     // Check for Set: same rank, all different suits
//     const isSet =
//       uniqueRanks.size === 1 &&
//       suits.length === uniqueSuits.size &&
//       uniqueSuits.size + jokerCount === meld.length &&
//       (meld.length === 3 || meld.length === 4) &&
//       ((meld.length === 3 && jokerCount <= 1) ||
//         (meld.length === 4 && jokerCount <= 2));

//     if (isSet) return true;

//     // Check for Run: same suit or all jokers
//     if (
//       uniqueSuits.size === 1 ||
//       (uniqueSuits.size === 0 && jokerCount === meld.length)
//     ) {
//       const sortedIndices = ranks
//         .map((r) => rankOrder.indexOf(r))
//         .sort((a, b) => a - b);

//       // const isSpecialQKA =
//       //   meld.length === 3 &&
//       //   ranks.includes("Q") &&
//       //   ranks.includes("K") &&
//       //   ranks.includes("A") &&
//       //   sortedIndices.toString() ===
//       //     [
//       //       rankOrder.indexOf("Q"),
//       //       rankOrder.indexOf("K"),
//       //       rankOrder.indexOf("A")
//       //     ].toString();

//       // if (isSpecialQKA) return true;

//       // ✅ Fix Q-K-A check
// const isSpecialQKA =
// meld.length === 3 &&
// ranks.includes("Q") &&
// ranks.includes("K") &&
// ranks.includes("A") &&
// uniqueSuits.size === 1;

// if (isSpecialQKA) return true;


//       // Reject invalid K-A-2
//       const hasKA2 =
//         ranks.includes("K") && ranks.includes("A") && ranks.includes("2");
//       if (hasKA2) return false;

//       // Check gaps
//       let gaps = 0;
//       for (let i = 1; i < sortedIndices.length; i++) {
//         const diff = sortedIndices[i] - sortedIndices[i - 1];
//         if (diff === 0) return false;
//         if (diff > 1) gaps += diff - 1;
//       }

//       return gaps <= jokerCount;
//     }

//     return false;
//   } catch (err) {
//     console.error("Validation Error:", err);
//     return false;
//   }
// };
