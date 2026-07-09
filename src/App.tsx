import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { firebaseConfigError } from './lib/firebase'
import { card } from './lib/uiClasses'
import { Home } from './features/home/Home'
import { BoardList } from './features/board/BoardList'
import { HostGamePicker } from './features/host/HostGamePicker'
import { BoardEditor } from './features/board/BoardEditor'
import { NewGame } from './features/host/NewGame'
import { HostControl } from './features/host/HostControl'
import { PlayerJoin } from './features/player/PlayerJoin'
import { PlayerView } from './features/player/PlayerView'

function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-jeopardy-navy p-6 text-white">
      <div className={`animate-fade-in-up max-w-md p-8 text-center ${card}`}>
        <h1 className="mb-4 font-jeopardy text-2xl text-jeopardy-gold">Setup needed</h1>
        <p className="text-sm text-white/70">{firebaseConfigError}</p>
      </div>
    </div>
  )
}

function App() {
  if (firebaseConfigError) return <SetupNeeded />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<HostGamePicker />} />
        <Route path="/host/boards" element={<BoardList />} />
        <Route path="/host/boards/:boardId" element={<BoardEditor />} />
        <Route path="/host/new-game/:boardId" element={<NewGame />} />
        <Route path="/host/game/:roomCode" element={<HostControl />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/play/:roomCode" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
