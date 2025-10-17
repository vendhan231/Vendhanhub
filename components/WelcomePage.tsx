import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, THEME } from '../constants';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleProceedToLogin = () => {
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-${THEME.accent} via-white to-${THEME.accent} p-6 text-center`}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%234A7C59' fill-opacity='0.2'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414zM41 0c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zM52 26c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zM28.464 24.05l8.486-8.486 1.414 1.414-8.486 8.486-1.414-1.414z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
      {/* The animate-fadeIn class will require its CSS definition to be available globally (e.g., in index.html or a linked CSS file) */}
      <main className="z-10 animate-fadeIn"> 
        <h1 className={`text-5xl md:text-7xl font-bold text-${THEME.primary} drop-shadow-lg`}>
          {APP_NAME}
        </h1>
        <p className={`mt-4 text-xl md:text-2xl text-${THEME.secondary} font-light`}>
          Empowering Your Workforce.
        </p>
        <button
          onClick={handleProceedToLogin}
          className={`mt-12 inline-flex items-center px-10 py-4 bg-${THEME.primary} text-${THEME.primaryText} text-lg font-semibold rounded-lg shadow-xl hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} transition-all duration-300 ease-in-out hover:scale-105 transform`}
          aria-label="Proceed to Login"
        >
          Proceed to Login
          <ArrowRightIcon className="ml-3 h-6 w-6" />
        </button>
      </main>
      <footer className={`absolute bottom-6 text-center text-sm text-gray-500 z-10`}>
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>

      {/* 
        The <style jsx global> tag was removed as it's not standard JSX/TypeScript and caused an error.
        For the animation to work, the following CSS needs to be included globally, for example,
        in a <style> tag in your index.html or in a linked CSS file:

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      */}
    </div>
  );
};

export default WelcomePage;