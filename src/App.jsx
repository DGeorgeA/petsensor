import { useEffect } from "react";
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { maybeRedirectToBase44Login } from './api/base44Client'

function App() {

  useEffect(() => {
    maybeRedirectToBase44Login();
  }, []); // run once when the app loads

  return (
    <>
      <Pages />
      <Toaster />
    </>
  );
}

export default App;

