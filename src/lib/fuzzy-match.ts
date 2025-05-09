/**
 * Fuzzy matching utility for intelligent word suggestions
 * Helps infer intended words from partial or misspelled input
 */

// Levenshtein distance calculation for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the best fuzzy matches for a partial word
 * @param partial The partial or potentially misspelled word
 * @param candidates Array of candidate words to match against
 * @param maxDistance Maximum Levenshtein distance to consider (default: 2)
 * @param limit Maximum number of matches to return (default: 5)
 * @returns Array of matching words sorted by relevance
 */
export function findFuzzyMatches(
  partial: string,
  candidates: string[],
  maxDistance: number = 2,
  limit: number = 5
): string[] {
  // For very short inputs, only do prefix matching
  if (partial.length < 2) {
    return candidates
      .filter(word => word.toLowerCase().startsWith(partial.toLowerCase()))
      .slice(0, limit);
  }

  // Calculate distances and create matches array
  const matches = candidates
    .map(word => {
      // Exact prefix match gets priority
      if (word.toLowerCase().startsWith(partial.toLowerCase())) {
        return { word, distance: 0, isPrefixMatch: true };
      }
      
      // Calculate Levenshtein distance
      const distance = levenshteinDistance(
        partial.toLowerCase(),
        word.toLowerCase().substring(0, Math.min(partial.length + 2, word.length))
      );
      
      return { word, distance, isPrefixMatch: false };
    })
    .filter(match => match.distance <= maxDistance || match.isPrefixMatch)
    .sort((a, b) => {
      // Sort by prefix match first, then by distance
      if (a.isPrefixMatch && !b.isPrefixMatch) return -1;
      if (!a.isPrefixMatch && b.isPrefixMatch) return 1;
      
      // Then by distance
      if (a.distance !== b.distance) return a.distance - b.distance;
      
      // Then by length (prefer shorter words)
      return a.word.length - b.word.length;
    })
    .map(match => match.word)
    .slice(0, limit);

  return matches;
}

/**
 * Common grammatical connectors to prioritize in suggestions
 */
export const grammaticalConnectors = {
  articles: ['a', 'an', 'the'],
  prepositions: [
    'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
    'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
    'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into',
    'like', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside', 'over',
    'past', 'since', 'through', 'throughout', 'to', 'toward', 'under', 'underneath',
    'until', 'up', 'upon', 'with', 'within', 'without'
  ],
  conjunctions: [
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
    'although', 'because', 'since', 'unless', 'while', 'where'
  ],
  auxiliaryVerbs: [
    'am', 'is', 'are', 'was', 'were', 'be', 'being', 'been',
    'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'shall', 'should', 'may', 'might',
    'must', 'can', 'could'
  ]
};

// Flatten all grammatical connectors into a single array for easy lookup
export const allConnectors = [
  ...grammaticalConnectors.articles,
  ...grammaticalConnectors.prepositions,
  ...grammaticalConnectors.conjunctions,
  ...grammaticalConnectors.auxiliaryVerbs
];

/**
 * Determine if the next word should likely be a grammatical connector
 * based on the previous words and basic linguistic patterns
 * @param previousWords Array of previous words in the input
 * @returns Likely connector type or null
 */
export function predictNextConnector(previousWords: string[]): string[] | null {
  if (previousWords.length === 0) return null;
  
  const lastWord = previousWords[previousWords.length - 1].toLowerCase();
  
  // After articles, likely need a noun or adjective, not another connector
  if (grammaticalConnectors.articles.includes(lastWord)) {
    return null;
  }
  
  // After certain prepositions, an article often follows
  if (['of', 'for', 'with', 'by', 'from', 'to'].includes(lastWord)) {
    return grammaticalConnectors.articles;
  }
  
  // After nouns (simplified check - words not in our connector lists)
  // could be followed by conjunctions or prepositions
  if (!allConnectors.includes(lastWord)) {
    return [
      ...grammaticalConnectors.conjunctions,
      ...grammaticalConnectors.prepositions
    ];
  }
  
  return null;
}

/**
 * Simple n-gram analysis to predict next likely words based on previous words
 * @param text The current input text
 * @param recentTasks Array of recent tasks for context
 * @returns Array of likely next words
 */
export function analyzeNGrams(text: string, recentTasks: string[] = []): string[] {
  // Extract previous words from the current input
  const words = text.split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return [];
  
  // Build a simple n-gram model from recent tasks
  const bigramCounts: Record<string, Record<string, number>> = {};
  
  // Process recent tasks to build bigram model
  recentTasks.forEach(task => {
    const taskWords = task.split(/\s+/).filter(Boolean);
    
    for (let i = 0; i < taskWords.length - 1; i++) {
      const current = taskWords[i].toLowerCase();
      const next = taskWords[i + 1].toLowerCase();
      
      if (!bigramCounts[current]) {
        bigramCounts[current] = {};
      }
      
      bigramCounts[current][next] = (bigramCounts[current][next] || 0) + 1;
    }
  });
  
  // Get the last word from the input
  const lastWord = words[words.length - 1].toLowerCase();
  
  // Check if we have bigram data for this word
  if (bigramCounts[lastWord]) {
    // Sort by frequency
    return Object.entries(bigramCounts[lastWord])
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);
  }
  
  return [];
}
