import { UserButton } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  


  return (
    <div id="header" className='z-0 relative flex justify-between items-center'>
      <div id="user-button" className='ml-10 mt-3'>
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
        <div onClick={() => navigate(-1)} className="right-0 top-0 border-2 md:mr-15 border-slate-400 bg-slate-100 hover:bg-gray-200 rounded-lg w-fit h-fit px-1 flex justify-center items-center cursor-pointer select-none text-lg">
          Back
        </div>
      }
    </div>
  )
}

export default Header