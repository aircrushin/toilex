// In-memory store for "THE NOTHING" game scores and leaderboard
// Note: In production, this should use a persistent database

interface PlayerScore {
  userId: string;
  username: string;
  score: number;
  lastUpdated: number;
}

class GameStore {
  private scores: Map<string, PlayerScore> = new Map();
  private globalScore: number = 0;

  incrementScore(userId: string, username: string): { personalScore: number; globalScore: number } {
    const existing = this.scores.get(userId);

    if (existing) {
      existing.score += 1;
      existing.lastUpdated = Date.now();
    } else {
      this.scores.set(userId, {
        userId,
        username,
        score: 1,
        lastUpdated: Date.now()
      });
    }

    this.globalScore += 1;

    return {
      personalScore: this.scores.get(userId)!.score,
      globalScore: this.globalScore
    };
  }

  getLeaderboard(limit: number = 10): PlayerScore[] {
    return Array.from(this.scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getPlayerScore(userId: string): number {
    return this.scores.get(userId)?.score || 0;
  }

  getGlobalScore(): number {
    return this.globalScore;
  }
}

// Singleton instance
export const gameStore = new GameStore();
