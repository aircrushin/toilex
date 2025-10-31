import { useState, useEffect } from "react";
import type { Route } from "./+types/tracker";
import { TheNothing } from "../components/TheNothing";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase.client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "💩 Poop Tracker 9000 - Log Your Bathroom Analytics" },
    { name: "description", content: "Track your toilet usage and predict your next bowel movement with cutting-edge AI!" },
  ];
}

interface ToiletSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  type: "number1" | "number2" | "both";
  notes?: string;
}

interface PredictionResult {
  nextTime: Date;
  confidence: number; // 0-100
  reasoning: string[];
  funnyQuote: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  lastUpdated: number;
  rank: number;
}

type ApiLeaderboardEntry = {
  userId: string;
  username: string;
  score: number;
  lastUpdated: number;
};

export default function Tracker() {
  const { user, session } = useAuth();
  const [sessions, setSessions] = useState<ToiletSession[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionType, setSessionType] = useState<"number1" | "number2" | "both">("number2");
  const [notes, setNotes] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load sessions from Supabase or localStorage
  useEffect(() => {
    const loadSessions = async () => {
      if (user) {
        // Load from Supabase for authenticated users
        const { data, error } = await supabase
          .from('toilet_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false });

        if (data && !error) {
          setSessions(data.map((s: any) => ({
            id: s.id,
            startTime: new Date(s.start_time),
            endTime: new Date(s.end_time),
            duration: s.duration,
            type: s.type,
            notes: s.notes,
          })));
        }
      } else {
        // Load from localStorage for non-authenticated users
        const stored = localStorage.getItem("powpdr-sessions");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSessions(parsed.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
          })));
        }
      }
      setLoading(false);
    };

    loadSessions();
  }, [user]);

  // Save sessions to localStorage for non-authenticated users
  useEffect(() => {
    if (!user && sessions.length > 0) {
      localStorage.setItem("powpdr-sessions", JSON.stringify(sessions));
    }
  }, [sessions, user]);

  // Timer for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  const startSession = () => {
    setSessionStartTime(new Date());
    setIsSessionActive(true);
    setElapsedTime(0);
    setIsGameActive(true);
  };

  const endGame = () => {
    setIsGameActive(false);
    // Call endSession to save the toilet session
    endSession();
  };

  const endSession = async () => {
    if (sessionStartTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);

      if (user) {
        // Save to Supabase for authenticated users
        const { data, error } = await supabase
          .from('toilet_sessions')
          .insert({
            user_id: user.id,
            start_time: sessionStartTime.toISOString(),
            end_time: endTime.toISOString(),
            duration,
            type: sessionType,
            notes: notes.trim() || null,
          })
          .select()
          .single();

        if (data && !error) {
          const newSession: ToiletSession = {
            id: data.id,
            startTime: new Date(data.start_time),
            endTime: new Date(data.end_time),
            duration: data.duration,
            type: data.type,
            notes: data.notes,
          };
          setSessions([newSession, ...sessions]);
        }
      } else {
        // Save to localStorage for non-authenticated users
        const newSession: ToiletSession = {
          id: Date.now().toString(),
          startTime: sessionStartTime,
          endTime,
          duration,
          type: sessionType,
          notes: notes.trim() || undefined,
        };
        setSessions([newSession, ...sessions]);
      }

      setIsSessionActive(false);
      setSessionStartTime(null);
      setElapsedTime(0);
      setNotes("");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "unknown";

    const diffMs = Date.now() - timestamp;
    if (Number.isNaN(diffMs)) return "unknown";

    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 5) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0);
    const avgDuration = Math.floor(totalTime / totalSessions);

    // Calculate time between sessions
    const intervals: number[] = [];
    for (let i = 0; i < sessions.length - 1; i++) {
      const interval = sessions[i].startTime.getTime() - sessions[i + 1].startTime.getTime();
      intervals.push(interval / (1000 * 60 * 60)); // convert to hours
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

    // Find most common hour of day
    const hourCounts: Record<number, number> = {};
    sessions.forEach(s => {
      const hour = s.startTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostCommonHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      totalSessions,
      totalTime,
      avgDuration,
      avgInterval,
      mostCommonHour: mostCommonHour ? parseInt(mostCommonHour) : null,
      longestSession: Math.max(...sessions.map(s => s.duration)),
      shortestSession: Math.min(...sessions.map(s => s.duration)),
    };
  };

  const generatePrediction = (): PredictionResult => {
    const stats = calculateStats();

    if (!stats || sessions.length < 2) {
      return {
        nextTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        confidence: 15,
        reasoning: [
          "Not enough data yet! I'm basically guessing here.",
          "Keep logging those dumps for better predictions!",
          "My crystal ball is very cloudy right now..."
        ],
        funnyQuote: "I have absolutely no idea what I'm doing! 🤷‍♂️"
      };
    }

    // "ML" prediction based on average interval
    const lastSession = sessions[0];
    const predictedInterval = stats.avgInterval * 60 * 60 * 1000; // convert hours to ms
    let nextTime = new Date(lastSession.endTime.getTime() + predictedInterval);

    // Adjust to most common hour if prediction is close
    if (stats.mostCommonHour !== null) {
      const predictedHour = nextTime.getHours();
      const hourDiff = Math.abs(predictedHour - stats.mostCommonHour);

      if (hourDiff <= 2) {
        nextTime.setHours(stats.mostCommonHour);
        nextTime.setMinutes(0);
      }
    }

    // Calculate "confidence" based on consistency
    const intervalVariance = (intervals: number[]) => {
      if (intervals.length < 2) return 0;
      const mean = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / intervals.length;
      return Math.sqrt(variance);
    };

    const intervals: number[] = [];
    for (let i = 0; i < sessions.length - 1; i++) {
      const interval = sessions[i].startTime.getTime() - sessions[i + 1].startTime.getTime();
      intervals.push(interval / (1000 * 60 * 60));
    }

    const variance = intervalVariance(intervals);
    const confidence = Math.max(20, Math.min(85, Math.floor(100 - (variance * 5))));

    const funnyQuotes = [
      "My algorithms are powered by fiber and false confidence!",
      "Trust me, I'm an AI (Actually Inaccurate)!",
      "I've analyzed your poops with the precision of a drunk fortune teller!",
      "Based on advanced toilet science and wild guessing!",
      "My prediction accuracy is about as regular as your bowels!",
      "I used machine learning, but the machine didn't learn much!",
    ];

    const reasoning = [
      `You typically poop every ${stats.avgInterval.toFixed(1)} hours`,
      stats.mostCommonHour !== null
        ? `You love dropping bombs around ${stats.mostCommonHour % 12 || 12}${stats.mostCommonHour >= 12 ? 'PM' : 'AM'}`
        : "Your schedule is chaos!",
      `Your sessions average ${formatDuration(stats.avgDuration)} of quality throne time`,
      variance < 5
        ? "You're impressively regular!"
        : "Your bowels are wildly unpredictable!",
    ];

    return {
      nextTime,
      confidence,
      reasoning,
      funnyQuote: funnyQuotes[Math.floor(Math.random() * funnyQuotes.length)],
    };
  };

  const stats = calculateStats();
  const prediction = sessions.length > 0 ? generatePrediction() : null;

  const deleteSession = async (id: string) => {
    if (user) {
      // Delete from Supabase
      await supabase
        .from('toilet_sessions')
        .delete()
        .eq('id', id);
    }
    setSessions(sessions.filter(s => s.id !== id));
  };

  const clearAllSessions = async () => {
    if (confirm("Delete all your precious poop data? This cannot be undone!")) {
      if (user) {
        // Delete from Supabase
        await supabase
          .from('toilet_sessions')
          .delete()
          .eq('user_id', user.id);
      } else {
        localStorage.removeItem("powpdr-sessions");
      }
      setSessions([]);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async () => {
    if (!user || !session) return;

    try {
      const response = await fetch("/api/game/leaderboard", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch leaderboard");
      }

      const payload = await response.json() as { leaderboard?: ApiLeaderboardEntry[] };
      const gameLeaderboard = (payload.leaderboard ?? []).map((entry, index) => ({
        userId: entry.userId,
        username: entry.username,
        score: entry.score,
        lastUpdated: entry.lastUpdated,
        rank: index + 1,
      }));

      setLeaderboard(gameLeaderboard);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    if (user && session && showLeaderboard) {
      loadLeaderboard();
    }
  }, [user, session, showLeaderboard]);

  // If game is active, show THE NOTHING
  if (isGameActive) {
    return <TheNothing onEndGame={endGame} sessionDuration={elapsedTime} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-700 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="pt-4">
          <Breadcrumbs />
        </div>
        <div className="text-center mb-8 pt-8">
          <div className="text-7xl mb-4">📊💩⏱️</div>
          <h1 className="text-6xl font-black text-yellow-200 mb-2" style={{textShadow: '3px 3px 0 #78350f'}}>
            Poop Tracker 9000
          </h1>
          <p className="text-yellow-100 text-xl font-bold">
            💩 Log Your Dumps, Predict Your Future 💩
          </p>
          <p className="text-lg text-yellow-200 mt-2 font-semibold">
            Advanced ML-Powered Bowel Movement Forecasting™
          </p>
        </div>

        {!user && (
          <div className="mb-6 bg-gradient-to-r from-blue-800 to-indigo-800 rounded-lg shadow-xl p-4 border-3 border-blue-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">ℹ️</span>
                <div>
                  <p className="text-blue-100 font-bold">Not signed in</p>
                  <p className="text-blue-200 text-sm">Sign in to sync your data across devices and compete on the leaderboard!</p>
                </div>
              </div>
              <a
                href="/auth"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                Sign In
              </a>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Session Logger */}
          <div className="bg-gradient-to-br from-amber-900 to-yellow-800 rounded-lg shadow-2xl p-8 border-4 border-yellow-600">
            <h2 className="text-3xl font-black text-yellow-100 mb-4 text-center">
              {isSessionActive ? "⏱️ Session in Progress" : "🚽 Start a Session"}
            </h2>

            {!isSessionActive ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-yellow-100 font-bold mb-2">Type of Business:</label>
                  <div className="flex gap-3">
                    {[
                      { value: "number1", label: "#1 💧", emoji: "💧" },
                      { value: "number2", label: "#2 💩", emoji: "💩" },
                      { value: "both", label: "Both 💩💧", emoji: "💩💧" }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSessionType(option.value as any)}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold border-3 transition-all ${
                          sessionType === option.value
                            ? "bg-yellow-600 border-yellow-500 text-white scale-105"
                            : "bg-yellow-800/50 border-yellow-700 text-yellow-200 hover:bg-yellow-700/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startSession}
                  className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-black py-6 px-8 rounded-lg text-2xl transition-all border-4 border-yellow-500 transform hover:scale-105 shadow-xl"
                >
                  💩 START LOGGING 💩
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-7xl mb-4 animate-bounce">⏱️</div>
                  <div className="text-6xl font-black text-yellow-200 mb-2">
                    {formatDuration(elapsedTime)}
                  </div>
                  <p className="text-yellow-100 font-semibold text-lg">
                    {sessionType === "number1" ? "💧 Draining..." : sessionType === "number2" ? "💩 Dropping..." : "💩💧 Full Service!"}
                  </p>
                </div>

                <div>
                  <label className="block text-yellow-100 font-bold mb-2">Notes (optional):</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How was it? Smooth? Challenging? Epic?"
                    className="w-full px-4 py-3 rounded-lg bg-yellow-100 text-gray-900 border-3 border-yellow-600 font-semibold"
                    rows={3}
                  />
                </div>

                <button
                  onClick={endSession}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-black py-6 px-8 rounded-lg text-2xl transition-all border-4 border-green-500 transform hover:scale-105 shadow-xl"
                >
                  ✅ FINISH & SAVE
                </button>
              </div>
            )}
          </div>

          {/* Prediction Panel */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg shadow-2xl p-8 border-4 border-purple-600">
            <h2 className="text-3xl font-black text-purple-100 mb-4 text-center">
              🔮 Next Dump Prediction
            </h2>

            {prediction ? (
              <div className="space-y-6">
                <div className="bg-purple-800/50 rounded-lg p-6 border-3 border-purple-500">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">🔮</div>
                    <p className="text-sm text-purple-200 font-semibold mb-2">YOUR BOWELS WILL CALL AT:</p>
                    <div className="text-3xl font-black text-purple-100">
                      {prediction.nextTime.toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-purple-200 font-semibold mb-2">Confidence Level:</p>
                    <div className="bg-purple-900 rounded-full h-6 overflow-hidden border-2 border-purple-500">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all flex items-center justify-center"
                        style={{ width: `${prediction.confidence}%` }}
                      >
                        <span className="text-white font-black text-sm">{prediction.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-800/30 rounded-lg p-4 border-2 border-purple-500/50">
                  <p className="text-purple-100 font-bold text-center italic text-lg">
                    "{prediction.funnyQuote}"
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-purple-100 font-bold">🧠 AI Reasoning:</p>
                  <ul className="space-y-2">
                    {prediction.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-purple-300 mr-2">•</span>
                        <span className="text-purple-200 font-semibold">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-8xl mb-4 opacity-50">🔮❌</div>
                <p className="text-purple-200 text-center font-semibold text-lg">
                  No predictions yet!
                  <br />
                  Log at least 2 sessions to unlock the mystical poop prophecy!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="bg-gradient-to-br from-blue-900 to-cyan-900 rounded-lg shadow-2xl p-8 border-4 border-blue-600 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-blue-100">
                📊 Your Toilet Analytics
              </h2>
              <button
                onClick={() => setShowStats(!showStats)}
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
            </div>

            {showStats && (
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">📈</div>
                  <p className="text-sm text-blue-200 font-semibold">Total Sessions</p>
                  <p className="text-3xl font-black text-blue-100">{stats.totalSessions}</p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">⏱️</div>
                  <p className="text-sm text-blue-200 font-semibold">Avg Duration</p>
                  <p className="text-3xl font-black text-blue-100">{formatDuration(stats.avgDuration)}</p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className="text-sm text-blue-200 font-semibold">Longest Session</p>
                  <p className="text-3xl font-black text-blue-100">{formatDuration(stats.longestSession)}</p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-sm text-blue-200 font-semibold">Quickest Visit</p>
                  <p className="text-3xl font-black text-blue-100">{formatDuration(stats.shortestSession)}</p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">🕐</div>
                  <p className="text-sm text-blue-200 font-semibold">Favorite Hour</p>
                  <p className="text-3xl font-black text-blue-100">
                    {stats.mostCommonHour !== null
                      ? `${stats.mostCommonHour % 12 || 12}${stats.mostCommonHour >= 12 ? 'PM' : 'AM'}`
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm text-blue-200 font-semibold">Avg Interval</p>
                  <p className="text-3xl font-black text-blue-100">
                    {stats.avgInterval.toFixed(1)}h
                  </p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-sm text-blue-200 font-semibold">Total Throne Time</p>
                  <p className="text-3xl font-black text-blue-100">
                    {Math.floor(stats.totalTime / 60)}m
                  </p>
                </div>

                <div className="bg-blue-800/50 rounded-lg p-4 border-2 border-blue-500">
                  <div className="text-3xl mb-2">💩</div>
                  <p className="text-sm text-blue-200 font-semibold">Dedication Level</p>
                  <p className="text-2xl font-black text-blue-100">
                    {stats.totalSessions > 20 ? "LEGENDARY" :
                     stats.totalSessions > 10 ? "EXPERT" :
                     stats.totalSessions > 5 ? "REGULAR" : "NEWBIE"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {user && (
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg shadow-2xl p-8 border-4 border-purple-600 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-purple-100">
                🏆 Global Throne Leaderboard
              </h2>
              <button
                type="button"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
              </button>
            </div>

            {showLeaderboard && (
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🚽</div>
                    <p className="text-purple-200 font-semibold">
                      No leaderboard data yet! Be the first to claim the throne!
                    </p>
                  </div>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className="bg-purple-800/50 rounded-lg p-4 border-2 border-purple-500 flex items-center justify-between hover:bg-purple-800/70 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-black text-purple-300 min-w-[3rem]">
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-purple-100">{entry.username}</p>
                          <p className="text-sm text-purple-300">
                            Updated {formatTimeAgo(entry.lastUpdated)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-purple-200">
                          {entry.score}
                        </p>
                        <p className="text-xs text-purple-300">score</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Session History */}
        <div className="bg-gradient-to-br from-amber-900 to-yellow-800 rounded-lg shadow-2xl p-8 border-4 border-yellow-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-yellow-100">
              📜 Session History
            </h2>
            {sessions.length > 0 && (
              <button
                onClick={clearAllSessions}
                className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4 opacity-50">📭</div>
              <p className="text-yellow-200 font-semibold text-lg">
                No sessions logged yet!
                <br />
                Start tracking your bathroom adventures above!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-yellow-700/30 rounded-lg p-4 border-2 border-yellow-600 hover:bg-yellow-700/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">
                          {session.type === "number1" ? "💧" : session.type === "number2" ? "💩" : "💩💧"}
                        </span>
                        <div>
                          <p className="text-yellow-100 font-bold text-lg">
                            {formatDateTime(session.startTime)}
                          </p>
                          <p className="text-yellow-200 text-sm font-semibold">
                            Duration: {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>
                      {session.notes && (
                        <p className="text-yellow-200 text-sm italic ml-12">
                          "{session.notes}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="text-red-400 hover:text-red-300 font-bold ml-4"
                      title="Delete session"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
