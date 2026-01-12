import React from 'react';
import Loader from './Loader';

const FullPageLoader = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <Loader />
    </div>
  );
};

export default FullPageLoader;
