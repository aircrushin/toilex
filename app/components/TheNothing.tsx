import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase.client";

interface TheNothingProps {
  onEndGame: () => void;
  sessionDuration: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  lastUpdated: number;
}

export function TheNothing({ onEndGame, sessionDuration }: TheNothingProps) {
  const { user, session } = useAuth();
  const [personalScore, setPersonalScore] = useState(0);
  const [globalScore, setGlobalScore] = useState(0);
  const [buttonPosition, setButtonPosition] = useState({ x: 50, y: 50 });
  const [isVisible, setIsVisible] = useState(true);
  const [buttonSize, setButtonSize] = useState(100);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get username from user metadata or generate a default
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || `Player-${user?.id?.slice(0, 8)}`;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchLeaderboard = async () => {
    if (!session) return;
    
    try {
      const response = await fetch("/api/game/leaderboard", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setGlobalScore(data.globalScore);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  };

  // Fetch initial leaderboard
  useEffect(() => {
    if (session) {
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const moveButton = () => {
    if (!containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const maxX = 90; // percentage
    const maxY = 90; // percentage

    setButtonPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY
    });
  };

  const handleButtonClick = async () => {
    if (!user || !session) {
      console.error("User not authenticated");
      return;
    }

    try {
      // Send score to backend with auth token
      const formData = new FormData();
      formData.append("username", username);

      const response = await fetch("/api/game/click", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Error from server:", data.error);
        return;
      }
      
      setPersonalScore(data.personalScore);
      setGlobalScore(data.globalScore);

      // Trigger tricky behaviors
      const behaviors = [
        () => moveButton(), // Move
        () => { // Shrink
          setButtonSize(Math.max(30, Math.random() * 120));
          setTimeout(() => setButtonSize(100), 2000);
        },
        () => { // Disappear temporarily
          setIsVisible(false);
          setTimeout(() => {
            setIsVisible(true);
            moveButton();
          }, 1000);
        },
        () => moveButton(), // Just move (more common)
        () => moveButton(), // Just move (more common)
      ];

      // Execute random behavior
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      behavior();

      // Fetch updated leaderboard
      fetchLeaderboard();
    } catch (error) {
      console.error("Failed to record click:", error);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    // 60% chance to move when hovering
    if (Math.random() > 0.4) {
      moveButton();
    }
  };

  // Show auth required message if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-8 bg-gray-900 border-2 border-red-600 rounded-lg">
          <h2 className="text-3xl font-black text-red-400 mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-4">You must be signed in to play THE NOTHING</p>
          <button
            onClick={onEndGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-b-2 border-gray-700 p-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">THE NOTHING</h1>
              <p className="text-gray-400 text-sm">Click the button... if you can.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gray-800/50 rounded-lg px-4 py-2 border-2 border-yellow-600">
                <p className="text-gray-400 text-xs mb-1">Session Time</p>
                <p className="text-2xl font-black text-yellow-400">{formatDuration(sessionDuration)}</p>
              </div>
              <button
                onClick={onEndGame}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                End Session
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-blue-600">
              <p className="text-gray-400 text-sm mb-1">Your Score</p>
              <p className="text-4xl font-black text-blue-400">{personalScore}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-purple-600">
              <p className="text-gray-400 text-sm mb-1">Global Score</p>
              <p className="text-4xl font-black text-purple-400">{globalScore}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-green-600">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="w-full text-left"
              >
                <p className="text-gray-400 text-sm mb-1">Leaderboard</p>
                <p className="text-2xl font-black text-green-400">
                  {showLeaderboard ? "Hide ▼" : "Show ▶"}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div className="absolute top-32 right-4 w-80 bg-gray-900/95 backdrop-blur-sm border-2 border-green-600 rounded-lg p-4 z-10 max-h-96 overflow-y-auto">
          <h3 className="text-xl font-black text-green-400 mb-4">Top Players</h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No scores yet!</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="text-white font-bold">{entry.username}</p>
                      <p className="text-green-400 text-sm font-bold">{entry.score} clicks</p>
                    </div>
                  </div>
                  {index === 0 && <span className="text-2xl">👑</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* The Nothing - Button Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-600 text-2xl font-bold">
          <p className="mb-2">THE NOTHING</p>
          <p className="text-sm">Can you click what doesn't want to be clicked?</p>
        </div>
      </div>

      {/* The Elusive Button */}
      {isVisible && (
        <button
          onClick={handleButtonClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovering(false)}
          style={{
            position: "absolute",
            left: `${buttonPosition.x}%`,
            top: `${buttonPosition.y}%`,
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            transition: "all 0.3s ease-out",
            transform: isHovering ? "scale(1.1)" : "scale(1)"
          }}
          className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                     text-white font-black rounded-full shadow-2xl border-4 border-white
                     flex items-center justify-center text-lg
                     cursor-pointer z-20"
        >
          CLICK
        </button>
      )}

      {/* Void effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
