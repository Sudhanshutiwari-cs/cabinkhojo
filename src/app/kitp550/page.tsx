import { Metadata } from 'next';
import * as React from 'react';
import { RiToolsFill } from 'react-icons/ri';

export const metadata: Metadata = {
  title: 'Under Construction',
};

export default function UnderConstruction() {
  return (
    <main>
      <section className='bg-white'>
        <div className='layout flex min-h-screen flex-col items-center justify-center text-center text-black'>
          <RiToolsFill
            size={60}
            className='drop-shadow-glow animate-flicker text-yellow-500'
          />
          <h1 className='mt-8 text-4xl md:text-6xl'>Under Construction</h1>
          <p className='mt-4 text-lg md:text-xl max-w-md'>
            We're working hard to bring you something amazing. Please check back soon!
          </p>
        </div>
      </section>
    </main>
  );
}