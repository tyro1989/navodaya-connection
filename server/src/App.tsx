import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Cursor Workspace</h1>
        <p>This is a modern React + TypeScript + Vite application</p>
        
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>

        <div className="features">
          <h2>Features</h2>
          <ul>
            <li>⚡️ Fast development with Vite</li>
            <li>⚛️ React 18 with TypeScript</li>
            <li>🎨 Modern CSS with Tailwind-like utilities</li>
            <li>🔧 ESLint configuration</li>
            <li>📦 Hot Module Replacement</li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App 