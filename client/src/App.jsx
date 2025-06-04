import React, { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus, AuthError, InteractionRequiredAuthError } from "@azure/msal-browser";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import History from "./pages/History";
import Files from "./pages/Files";

function Navbar() {
  const location = useLocation();
  const { instance, accounts } = useMsal();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profilePic, setProfilePic] = React.useState(null);
  const user = accounts && accounts[0];
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : (user?.username ? user.username[0].toUpperCase() : '?');

  console.info('Profile Pic:', profilePic);

  // Fetch profile picture from Microsoft Graph
  React.useEffect(() => {
    console.info('Fetching profile picture for user:', user);
    async function fetchProfilePic() {
      if (!user) return;
      try {
        // Acquire access token for Microsoft Graph
        const request = {
          scopes: ["User.Read"],
          account: user,
        };
        console.info('Request:', request);
        console.info('Instance:', instance);
        const { accessToken } = await instance.acquireTokenSilent(request);
        // Fetch profile photo as blob
        console.info('Access Token:', accessToken);
        const res = await fetch("https://graph.microsoft.com/v1.0/me/photos/48x48/$value", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.info('Profile photo fetch response:', res);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => setProfilePic(reader.result);
          reader.readAsDataURL(blob);
        } else {
          setProfilePic(null);
        }
      } catch (err) {
        if (err instanceof AuthError || err instanceof InteractionRequiredAuthError) {
          // If authentication error, redirect to login
          console.error('Authentication error:', err);
          await instance.loginRedirect();
          return;
        }
        console.rror('Error fetching profile picture:', err);
        setProfilePic(null);
      }
    }
    fetchProfilePic();
  }, [user, instance]);

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (!e.target.closest('#user-avatar-menu')) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  return (
    <nav className="bg-[#1a2233] text-white px-8 py-2 mb-8 flex items-center shadow-md justify-between">
      <div className="flex items-center gap-8">
        <div className="font-bold text-[1.2rem] tracking-wide">
          The Graycor Way AI
        </div>
        <div className="flex gap-6 items-center">
          <Link
            to="/"
            className={`no-underline font-medium text-base pb-1 transition-colors border-b-2 ${location.pathname === "/" ? "text-[#61dafb] border-[#61dafb]" : "text-white border-transparent hover:text-[#61dafb]"}`}
          >
            Home
          </Link>
          <Link
            to="/history"
            className={`no-underline font-medium text-base pb-1 transition-colors border-b-2 ${location.pathname === "/history" ? "text-[#61dafb] border-[#61dafb]" : "text-white border-transparent hover:text-[#61dafb]"}`}
          >
            Query History
          </Link>
          <Link
            to="/files"
            className={`no-underline font-medium text-base pb-1 transition-colors border-b-2 ${location.pathname === "/history" ? "text-[#61dafb] border-[#61dafb]" : "text-white border-transparent hover:text-[#61dafb]"}`}
          >
            Files
          </Link>
        </div>
      </div>
      {/* User Avatar */}
      {user && (
        <div className="relative" id="user-avatar-menu">
          <button
            className="ml-4 w-10 h-10 rounded-full bg-[#61dafb] text-[#1a2233] flex items-center justify-center font-bold text-lg shadow hover:ring-2 hover:ring-[#61dafb] focus:outline-none focus:ring-2 focus:ring-[#61dafb] overflow-hidden"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="User menu"
            type="button"
          >
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="w-full h-full object-fit rounded-full"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              initials
            )}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-[#1a2233] rounded shadow-lg z-50 border border-gray-200 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100 text-sm font-semibold truncate">{user.name || user.username}</div>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => { setMenuOpen(false); instance.logoutRedirect(); }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();

  // Set the active account after login
  useEffect(() => {
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  if (!isAuthenticated && inProgress === InteractionStatus.None) {
    instance.loginRedirect();
    return <div>Redirecting to login...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;