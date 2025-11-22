import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Share Photos with Clients
            <br />
            <span className="text-blue-500">in 30 Seconds</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Beautiful, fast galleries for wedding and portrait photographers.
            No learning curve. Half the price of competitors.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-lg transition-colors"
            >
              View Demo Gallery
            </Link>
          </div>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-800/50 rounded-xl">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-gray-400">
              Upload and share galleries in under 30 seconds. Your clients will love the instant loading.
            </p>
          </div>

          <div className="p-8 bg-gray-800/50 rounded-xl">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-2xl font-bold mb-3">Mobile First</h3>
            <p className="text-gray-400">
              Gorgeous on every device. Optimized for the way your clients actually view photos.
            </p>
          </div>

          <div className="p-8 bg-gray-800/50 rounded-xl">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-3">50% Cheaper</h3>
            <p className="text-gray-400">
              Professional features starting at $9/month. No hidden fees. Cancel anytime.
            </p>
          </div>
        </div>

        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-6">Trusted by Professional Photographers</h2>
          <p className="text-gray-400 mb-8">Join hundreds of photographers delivering better client experiences</p>
          <div className="flex gap-4 justify-center items-center text-sm text-gray-500">
            <span>✓ 14-day free trial</span>
            <span>✓ No credit card required</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </main>
  );
}
