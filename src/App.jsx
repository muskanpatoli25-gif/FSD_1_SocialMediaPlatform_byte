
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PostDetails from "./pages/PostDetails";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";

import ProtectedRoute from "./components/Protectedroute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/post/:id" element={<PostDetails />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:userId" element={<Chat />} />
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
