import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import useAuthUser from "./hooks/useAuthUser";

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
  const { pathname } = useLocation();
  const { data:authUser, isLoading, isError, error, refetch } = useAuthUser();

  if (isError) return <div role="alert" className="mx-auto p-8 text-white">{error.message} <button type="button" className="cursor-pointer underline" onClick={() => refetch()}>Retry</button></div>;

  if(isLoading)
  {
    return (<div className='h-screen flex justify-center items-center'>
    <LoadingSpinner size='lg' />

    </div>)
  }
  return (
    <div className='flex w-full max-w-6xl min-h-screen mx-auto text-white'>
      {/* common component since it isn't inside the routes */}
      {authUser && <Sidebar authUser={authUser} />}
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to="/login" />} />
        <Route path='/profile/:username' element={authUser ? <ProfilePage key={pathname} /> : <Navigate to="/login" />} />

      </Routes>
      {authUser && <RightPanel />}
      <Toaster />
    </div>
  )
}