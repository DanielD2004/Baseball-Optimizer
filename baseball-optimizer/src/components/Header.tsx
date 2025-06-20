import { useLocation, useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { signOut } = useClerk();

  const handleLogout = async () => {
    try {
      // Call Flask logout endpoint to clear session
      await fetch(`${import.meta.env.VITE_NGROK_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Then sign out from Clerk
      await signOut();

      // Optionally redirect
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div id="header" className='z-0 relative flex justify-between items-center -mb-13'>
      <div className='bg-gray-300 hover:bg-gray-400 ml-10 mt-5 flex items-center gap-4 h-7 p-2 transition duration-200 rounded-lg border-1 cursor-pointer'>
        <button
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {pathname !== '/' && 
        <div onClick={() => navigate(-1)} className="h-7 mt-5 right-0 top-0 border-2 md:mr-15 border-slate-400 bg-slate-100 hover:bg-gray-200 rounded-lg w-fitpx-1 flex justify-center items-center cursor-pointer select-none text-lg p-2">
          Back
        </div>
      }
    </div>
  )
}

export default Header;
