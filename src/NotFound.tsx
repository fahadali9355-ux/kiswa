import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl md:text-9xl font-serif text-accent tracking-widest mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-widest uppercase mb-8">Page Not Found</h2>
      <p className="text-foreground/60 max-w-md mb-12">
        We couldn't find the page you were looking for. It might have been removed, renamed, or did not exist.
      </p>
      <Link 
        to="/" 
        className="border border-accent text-accent px-8 py-3 text-sm tracking-widest uppercase hover:bg-accent hover:text-[#0A0A0A] transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
