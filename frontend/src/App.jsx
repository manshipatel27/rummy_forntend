import Login from "./components/pages/Login";
import{ createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Register from "./components/pages/register";
import Protected from "./components/common/Proctected";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { loginUser, logoutUser, setUser } from "./store/authSlice";
import GameTypePage from "./components/pages/GameTypePage";
import CreateGamePage from "./components/pages/CreateGamePage";
import JoinGamePage from "./components/pages/JoinGamePage";
import HomePage from "./components/pages/HomePage";
// import GameRoom from "./components/pages/GameRoom";
import socketService from "./socketService";
import GameRoom from "./components/pages/Room";
// import GamePlay from "./components/pages/GamePlay";

import WalletPage from "./components/pages/Wallet";




const router = createBrowserRouter(
  createRoutesFromElements(
    <> 
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/" element={<Protected><HomePage/></Protected>}/>
      <Route path="/game-type/:type" element={<Protected><GameTypePage /></Protected>}/>
      <Route path="/create-room/:type" element={<Protected><CreateGamePage/></Protected> } />
      <Route path="/join-room/:type" element={<Protected><JoinGamePage/></Protected>} />
      {/* <Route path="game-room/:type/:roomId" element={<Protected><GameRoom/></Protected>}/> */}
      {/* <Route path="game-room/:type/:roomId" element={<Protected><GamePlay/></Protected>}/> */}
      <Route path="/wallet" element={<Protected><WalletPage/></Protected>}/>
      <Route path="game-room/:type/:roomId" element={<Protected><GameRoom/></Protected>}/>


    </>
  )
);
function App() {
  const dispatch = useDispatch()
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = localStorage.getItem("userData");
        if (user) {
          const parsedUser = JSON.parse(user);
          dispatch(setUser(parsedUser));
          await socketService.connect(); // 👈 reconnect socket with stored token
        } else {
          dispatch(logoutUser());
        }
      } catch (error) {
        dispatch(logoutUser());
      } finally {
        setLoadingAuth(false);
      }
    };
  
    getUser();
  }, [dispatch]);
  
  
  if (loadingAuth) {
    return (<div>
    loading
  </div>)
  }

  return (
    <>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      reverseOrder={true}
      toastOptions={{
        error: { style: { borderRadius: 0, color: 'red' } },
        success: { style: { borderRadius: 0, color: 'green' } },
        duration: 2000,
      }}
    />
  </>
  );
}

export default App
