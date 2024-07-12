import ReactDOM from 'react-dom/client'
import { Login } from './pages/Login.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { GlobalProvider } from './context/globalContext.jsx'
import { Game } from './pages/Game.jsx';
import { History } from './pages/History.jsx';
import { Layout } from './pages/Layout.jsx';
import { Leaderboard } from './pages/Leaderboard.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Login />
      },
      {
        path: "game",
        element: <Game />
      },
      {
        path: "history",
        element: <History />
      },
      {
        path: "leaderboard",
        element: <Leaderboard />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
    <ChakraProvider>
      <GlobalProvider>
        <RouterProvider router={router} />
      </GlobalProvider>
    </ChakraProvider>
)
