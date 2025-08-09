import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../AuthContext";
import Modal from "../components/Modal";

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = useState(false);

  const handleCollaborativeClick = (e) => {
    if (!user) {
      e.preventDefault();
      setModalOpen(true); // show modal instead of alert
    }
  };

  const handleSignInClick = () => {
    setModalOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-blue-600">NovaBoard</h1>
        <Link
          to="/"
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Logout
        </Link>
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
        <p className="mb-4">You need to sign in to use the Collaborative Room feature.</p>
        <button
          onClick={handleSignInClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Go to Sign In
        </button>
      </Modal>
    </div>
  );
}

export default Home;
