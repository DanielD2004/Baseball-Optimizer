import { useEffect, useState } from 'react'


const URL = import.meta.env.VITE_NGROK_URL

function MePage() {
  const [htmlContent, setHtmlContent] = useState<string>('Loading...')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${URL}/api/me`, {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const text = await response.text()
          setHtmlContent(text)
        } else {
          setHtmlContent(`<h1>Error: ${response.status}</h1>`)
        }
      } catch (error) {
        console.error(error)
        setHtmlContent('<h1>Failed to fetch</h1>')
      }
    }

    fetchUser()
  }, [])

  return (
    <div>
      <h1>Hello</h1>
      <hr/><br/>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}


export default MePage
