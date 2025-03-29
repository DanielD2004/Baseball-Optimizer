import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'
import Teams from './pages/Teams.tsx'
import Header from './components/Header.tsx'
import TeamPage from './pages/TeamPage.tsx'
import './App.css'

function App() {
  const { user } = useUser()

  const addUser = async() => {
    if (!user){
      return;
    }
    else {
      try{
        const data = {
          "user_id": user.id,
          "full_name": user.fullName,
          "email": user.emailAddresses[0].emailAddress,
        }
        const response = await fetch(`http://localhost:5000/api/users`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      console.log(result)
      } catch (error) {
          console.error('Error fetching teams:', error);
      }
    }
  }

  useEffect(() => {
    if (user){
      addUser()
    }
  }, [user])

  return (
    <BrowserRouter>
      <SignedOut>
        <div style={{width:'500px', backgroundColor: 'aqua'}}> 
          <SignInButton mode="modal"/>
        </div>
      </SignedOut>
        <SignedIn>
          <Header/>
          <Routes>
            <Route path="/" element={<Teams/>}/>
            <Route path='/teams/:teamName/:season' element={<TeamPage/>}/>
          </Routes>
        </SignedIn>
    </BrowserRouter>

  )
}

export default App
