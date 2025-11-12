
import LandingPage from './components/LandingPage'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BusTrackingApp from './components/BusTrackingApp';
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Bus Tracking Page */}
        <Route path="/bus-tracking" element={<BusTrackingApp />} />
      </Routes>
    </Router>
  )
}

export default App