function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center">
      <div>
        <h1 className="text-4xl font-bold text-blue-600">NovaBoard</h1>
        <p className="text-lg mt-2 text-gray-600">Think Freely. Draw Boldly. Collaborate Instantly.</p>

        <div className="mt-6 flex gap-4 justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full">
            Personal Whiteboard
          </button>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full">
            Create / Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
