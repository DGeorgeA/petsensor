import { useEffect } from "react";
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
function App() {

  useEffect(() => {
    // App initialization
  }, []); // run once when the app loads

  return (
    <>
      <Pages />
      <Toaster />
    </>
  );
}

export default App;

