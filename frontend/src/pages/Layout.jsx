
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar';

export const Layout = () => {
  return (
    <>
      <Navbar />
      <Outlet /> 
    </>
  );
};