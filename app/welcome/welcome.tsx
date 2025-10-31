import { Link } from "react-router";

export function Welcome() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Disgusting background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-8xl">💩</div>
        <div className="absolute top-40 right-20 text-6xl">🚽</div>
        <div className="absolute bottom-20 left-40 text-7xl">💩</div>
        <div className="absolute top-1/2 right-1/3 text-9xl">💩</div>
        <div className="absolute bottom-40 right-10 text-5xl">🧻</div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="text-8xl mb-4">💩</div>
          <h1 className="text-7xl font-black text-yellow-200 mb-4 drop-shadow-lg" style={{textShadow: '3px 3px 0 #78350f'}}>
            TOILEX
          </h1>
          <p className="text-3xl text-yellow-100 mb-2 font-bold">
            💩 Your #2 Destination for #2 💩
          </p>
          <p className="text-xl text-yellow-200">
            Where Every Dump is a Masterpiece
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/chat"
            className="bg-gradient-to-br from-amber-700 to-yellow-800 rounded-lg shadow-2xl p-8 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all border-4 border-yellow-600 group transform hover:scale-105"
          >
            <div className="text-7xl mb-4 text-center animate-bounce">🚽💬</div>
            <h2 className="text-2xl font-black text-yellow-100 mb-3 text-center group-hover:text-white transition-colors">
              Poop-Time Chat
            </h2>
            <p className="text-yellow-200 text-center font-semibold">
              Chat with strangers while dropping bombs worldwide 💣
            </p>
          </Link>

          <Link
            to="/analyzer"
            className="bg-gradient-to-br from-yellow-700 to-amber-900 rounded-lg shadow-2xl p-8 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all border-4 border-amber-600 group transform hover:scale-105"
          >
            <div className="text-7xl mb-4 text-center animate-pulse">💩📊</div>
            <h2 className="text-2xl font-black text-yellow-100 mb-3 text-center group-hover:text-white transition-colors">
              Turd Analyzer
            </h2>
            <p className="text-yellow-200 text-center font-semibold">
              Rate your masterpiece! Upload pics for AI-powered crap ratings 📸
            </p>
          </Link>

          <Link
            to="/tracker"
            className="bg-gradient-to-br from-amber-900 to-yellow-700 rounded-lg shadow-2xl p-8 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all border-4 border-yellow-600 group transform hover:scale-105"
          >
            <div className="text-7xl mb-4 text-center animate-pulse">📅💩</div>
            <h2 className="text-2xl font-black text-yellow-100 mb-3 text-center group-hover:text-white transition-colors">
              Poop Predictor
            </h2>
            <p className="text-yellow-200 text-center font-semibold">
              Track your logs and predict when nature calls 🔮
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center bg-yellow-800/50 rounded-lg p-6 border-2 border-yellow-600">
          <p className="text-xl text-yellow-100 font-bold mb-2">
            ⚠️ WARNING: DISGUSTING CONTENT AHEAD ⚠️
          </p>
          <p className="text-sm text-yellow-200">
            A hackathon project so crappy, it's actually good
          </p>
        </div>
      </div>
    </main>
  );
}
