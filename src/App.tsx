import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./routes/home";
import Profile from "./routes/profile";
import Login from "./routes/login";
import CreateAccount from "./routes/create-account";
import styled, { createGlobalStyle } from "styled-components";
import reset from "styled-reset";
import { useEffect, useState } from "react";
import LoadingScreen from "./components/loading-screen";
import { auth } from "./firebase";
import ProtectedRoute from "./components/protected-route";

const router = createBrowserRouter([
  {
    path:"/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: 
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>,
      },
      {
        path: "profile",
        element: 
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      },
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/create-account",
    element: <CreateAccount />
  }
])

const GlobalStyles = createGlobalStyle`
  ${reset};
  * {
    box-sizing: border-box;
  }
  body {
    background-color: #000716;
    color: white;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;

  }
  ::-webkit-scrollbar{
    display: none;
  }
`;

const Wrapper = styled.div`
  height: 100hv;
  display: flex;
  justify-content: center;
`;

function App() {
  const [isLoading, setLading] = useState(true);
  const init = async() => {
    await auth.authStateReady();
    setLading(false);
  }
  useEffect(()=>{init();},[])
  return <Wrapper>
    <GlobalStyles />
    {isLoading ? <LoadingScreen /> : <RouterProvider router={router} />}
  </ Wrapper>
}

export default App
