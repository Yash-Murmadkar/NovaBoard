function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 text-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        {/* Logo / Name */}
        <h1 className="text-4xl font-bold text-blue-600">NovaBoard</h1>
        <p className="text-lg mt-2 text-gray-600">
          Think Freely. Draw Boldly. Collaborate Instantly.
        </p>

        {/* Auth / Guest Buttons */}
        <div className="mt-8 flex flex-col gap-4">
          <a
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg text-lg font-semibold"
          >
            Sign Up
          </a>
          <a
            href="/home"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg text-lg font-semibold"
          >
            Continue as Guest
          </a>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          Powered by NovaBoard
        </p>
      </div>
    </div>
  );
}

export default Landing;
