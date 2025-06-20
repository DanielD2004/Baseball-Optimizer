import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser, useAuth } from '@clerk/clerk-react'
import Teams from './pages/Teams.tsx'
import Header from './components/Header.tsx'
import TeamPage from './pages/TeamPage.tsx'
import OptimizedPage from './pages/OptimizedPage.tsx'
import MePage from './pages/MePage.tsx'
import { useGuest } from './useGuest.ts'
import './App.css'

const URL = import.meta.env.VITE_NGROK_URL

function App() {
  const { getToken } = useAuth();
  const { setGuestMode } = useGuest()
  const { user } = useUser()
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const login = async() => {
    const token = await getToken({ template: "Test" });

    if (!user){
      return;
    }
    else {
      try{
        const response = await fetch(`${URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      const res = await response.json();
      setGuestMode(res.guest_mode)
      setIsLoggedIn(true)
      } catch (error) {
          console.error('Error fetching teams:', error);
      }
    }
  }

  useEffect(() => {
    if (user){
      login()
    }
  }, [user])

  return (
    <BrowserRouter>
      <SignedOut>
        <h1 className="md:pt-110 pt-50 px-6 dark:text-white mb-1 text-slate-600 uppercase text-5xl md:text-7xl font-bold font-mono text-center tracking-wide text-shadow-slate-300 text-shadow-lg dark:text-shadow-2xl dark:text-shadow-black">Baseball Lineup Optimizer</h1>
        <div className='flex flex-col items-center space-y-5 mt-25 md:mt-45'> 
          <SignInButton mode="modal">
            <div className="w-1/2 bg-violet-300 border-2 rounded-md justify-center px-2 py-1 inline-flex h-20 select-none cursor-pointer items-center hover:bg-violet-300 transition duration-300">
              Sign In
            </div>
          </SignInButton>
          <SignUpButton mode="modal">
            <div className="w-1/2 bg-violet-300 border-2 rounded-md justify-center px-2 py-1 inline-flex h-20 select-none cursor-pointer items-center hover:bg-violet-300 transition duration-300">
              Sign Up
            </div>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <Header/>
        {isLoggedIn &&
          <Routes>
            <Route path="/" element={<Teams/>}/>
            <Route path='/teams/:teamId' element={<TeamPage/>}/>
            <Route path='/teams/:teamId/optimized' element={<OptimizedPage/>}/>
            <Route path='/me' element={<MePage/>}/>
          </Routes>
        }
      </SignedIn>
    </BrowserRouter>

  )
}

export default App
