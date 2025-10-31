import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";
import type { Route } from "./+types/auth";
import { Breadcrumbs } from "../components/Breadcrumbs";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "🚽 powpdr - Sign In" },
    { name: "description", content: "Sign in to track your bathroom adventures!" },
  ];
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError("Username is required");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) {
          setError(error.message);
        } else {
          navigate("/");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-700 p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="pt-4 mb-8">
          <Breadcrumbs />
        </div>
        <div className="bg-gradient-to-br from-amber-900 to-yellow-800 rounded-lg shadow-2xl p-8 border-4 border-yellow-600">
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">🚽</div>
            <h1 className="text-4xl font-black text-yellow-200 mb-2">
              {isSignUp ? "Join powpdr" : "Welcome Back"}
            </h1>
            <p className="text-yellow-100">
              {isSignUp ? "Start tracking your bathroom adventures!" : "Sign in to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-yellow-100 font-bold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-yellow-100 text-gray-900 border-3 border-yellow-600 font-semibold"
                  placeholder="Choose a username"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-yellow-100 font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-yellow-100 text-gray-900 border-3 border-yellow-600 font-semibold"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-yellow-100 font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-yellow-100 text-gray-900 border-3 border-yellow-600 font-semibold"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3">
                <p className="text-red-200 font-semibold text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-black py-4 px-8 rounded-lg text-xl transition-all border-4 border-yellow-500 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-yellow-200 hover:text-yellow-100 underline font-bold"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
