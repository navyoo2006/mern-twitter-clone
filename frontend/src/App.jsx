import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import HomePage from "./pages/auth/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";

import Sidebar from "./components/svgs/common/Sidebar";
import RightPanel from "./components/svgs/common/RightPanel";
import LoadingSpinner from "./components/svgs/common/LoadingSpinner";

import { Toaster } from "react-hot-toast";

export default function App() 
{
  const { data:authUser, isLoading } = useQuery({

    //the querykey is used to easily refer to the queries within other files
    queryKey: ['authUser'],
    queryFn: async () =>
    {
      try
      {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.error)
        {
          return null;
        }

        if (!res.ok)
        {
          throw new Error(data.error || "Something went wrong");
        }
        console.log("auth user is here:", data);
        return data;
      }
      catch(error)
      {
        throw new Error(error.message || "Something went wrong");
      }
      
    }
  });

  if(isLoading)
  {
    return (<div className='h-screen flex justify-center items-center'>
    <LoadingSpinner size='lg' />

    </div>)
  }
  return (
    <div className='flex w-full max-w-6xl min-h-screen mx-auto'>
      {/* common component since it isn't inside the routes */}
      {authUser && <Sidebar authUser={authUser} />}
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to="/login" />} />
        <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />

      </Routes>
      {authUser && <RightPanel />}
      <Toaster />
    </div>
  )
}