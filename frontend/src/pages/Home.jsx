import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../AuthContext";
import Modal from "../components/Modal";

function Home() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Debug user state changes
  useEffect(() => {
    console.log("User state changed:", user);
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCollaborativeClick = (e) => {
    if (!user) {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  const handleSignInClick = () => {
    setModalOpen(false);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-blue-600">NovaBoard</h1>
        {user && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm ${
              isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoggingOut ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging out...
              </span>
            ) : (
              "Logout"
            )}
          </button>
        )}
      </header>

      {/* Title + Subtitle */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Choose Your NovaBoard Mode
        </h2>
        <p className="text-gray-600 mt-2">
          Whether solo or with friends, NovaBoard has you covered.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Personal Whiteboard */}
        <Link
          to="/personal"
          className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow flex flex-col items-center text-center"
        >
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
            🖊️
          </div>
          <h3 className="text-xl font-semibold">Personal Whiteboard</h3>
          <p className="text-gray-500 mt-2">
            Your own space — no distractions. Just draw.
          </p>
        </Link>

        {/* Collaborative Room */}
        <Link
          to="/room"
          onClick={handleCollaborativeClick}
          className={`${
            !user ? "cursor-not-allowed opacity-50" : "hover:shadow-xl"
          } bg-white shadow-lg rounded-2xl p-6 transition-shadow flex flex-col items-center text-center`}
        >
          <div className="bg-purple-100 text-purple-600 p-4 rounded-full mb-4">
            👥
          </div>
          <h3 className="text-xl font-semibold">Collaborative Room</h3>
          <p className="text-gray-500 mt-2">
            Draw, chat, and voice call with your friends in real time.
          </p>
          {!user && (
            <p className="mt-2 text-red-500 text-sm">Sign in required</p>
          )}
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-gray-500 text-sm">Powered by NovaBoard</footer>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Sign In Required">
        <div className="space-y-4">
          <p className="mb-4">You need to sign in to use the Collaborative Room feature.</p>
          <div className="flex space-x-4">
            <button
              onClick={handleSignInClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex-1"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Home;