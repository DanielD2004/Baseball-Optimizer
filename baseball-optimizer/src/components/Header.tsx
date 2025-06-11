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
      <div className='ml-10 mt-7 flex items-center gap-4'>
        <button
          onClick={handleLogout}
          className="bg-red-400 text-white rounded-lg px-4 py-2 hover:bg-red-500 transition duration-200"
        >
          Logout
        </button>
      </div>

      {pathname !== '/' && 
        <div onClick={() => navigate(-1)} className="right-0 top-0 border-2 md:mr-15 border-slate-400 bg-slate-100 hover:bg-gray-200 rounded-lg w-fit h-fit px-1 flex justify-center items-center cursor-pointer select-none text-lg">
          Back
        </div>
      }
    </div>
  )
}

export default Header;
