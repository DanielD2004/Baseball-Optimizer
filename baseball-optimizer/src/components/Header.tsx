import React from 'react'
import { UserButton } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  return (
    <div id="header" className='flex justify-between items-center'>
      <div id="user-button" className='ml-10 mt-5'>
          <UserButton
              appearance={{
                  elements: {
                      avatarBox: {
                          width: '60px',
                          height: '60px',
                      }
                    }
                  }}
              showName
          />
      </div>
      {pathname !== '/' && 
        <div className="border-2 mr-15 border-slate-400 bg-slate-100 hover:bg-gray-200 rounded-lg w-fit h-fit p-1 flex justify-center items-center cursor-pointer select-none text-lg">
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      }
    </div>
  )
}

export default Header