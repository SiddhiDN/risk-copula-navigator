
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Html } from '@/components/ui/hero-futuristic';

const Landing = () => {
  const navigate = useNavigate();

  const handleEnterApplication = () => {
    navigate('/auth');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div onClick={handleEnterApplication} className="cursor-pointer">
        <Html />
      </div>
    </div>
  );
};

export default Landing;
