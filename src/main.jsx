import React from 'react'
import ReactDOM from 'react-dom/client'
import { Login } from './pages/Login.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Navbar } from './components/navbar.jsx'
import { GlobalProvider } from './context/globalContext.jsx'
import { Game } from './pages/Game.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/game",
    element:<Game />
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <GlobalProvider>
        <Navbar />
        <RouterProvider router={router} />
      </GlobalProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
