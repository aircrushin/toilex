import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export function AuthHeader() {
  const { user, signOut, loading } = useAuth();

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-20">
      <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
        {loading ? (
          <div className="text-yellow-200 font-bold">Loading...</div>
        ) : user ? (
          <>
            <div className="bg-yellow-800/50 rounded-lg px-4 py-2 border-2 border-yellow-600">
              <p className="text-yellow-100 font-bold">
                👤 {user.user_metadata?.username || user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all border-2 border-red-500"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition-all border-2 border-yellow-500"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
