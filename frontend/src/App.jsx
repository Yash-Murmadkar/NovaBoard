import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Personal from "./pages/Personal";
import Room from "./pages/Room";
import RoomSelection from "./pages/RoomSelection";
import Register from "./pages/Register";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        {/* New landing page */}
        <Route path="/" element={<Landing />} />

        {/* After choosing guest or logging in */}
        <Route path="/home" element={<Home />} />

        {/* Other pages */}
        <Route path="/personal" element={<Personal />} />
        <Route path="/room-selection" element={<RoomSelection />} />
        <Route path="/room/:id" element={<Room />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
