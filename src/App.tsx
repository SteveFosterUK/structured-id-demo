import { useState } from 'react'
import './App.css'
import { generateId } from "structured-id"

function App() {
  const [id, setId] = useState("XXXX-XXXX-XXXX-XXXX");

  return (
    <>
      <h1 className="text-blue-600">{id}</h1>
      <div className="card">
        <button onClick={() => setId(generateId({separator:"-", charset:"alphanumeric"}))}>
            Generate ID
        </button>
      </div>
    </>
  )
}

export default App
