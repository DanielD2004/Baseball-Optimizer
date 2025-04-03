import React from 'react'
import './Header.css'
import { UserButton } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  return (
    <div id="header">
      <div id="user-button" style={{paddingLeft: "30px", paddingTop: "5px"}}>
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
      {pathname !== '/' && <div id="backButton">
        <button onClick={() => navigate(-1)}>Back</button>
      </div>}
    </div>
  )
}

export default Header