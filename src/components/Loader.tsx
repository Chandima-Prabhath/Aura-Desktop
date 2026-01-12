import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center space-x-2">
      <div
        className="h-4 w-4 bg-primary rounded-md"
        style={{ animation: 'marshmallow-fade 1.4s infinite' }}
      />
      <div
        className="h-4 w-4 bg-primary rounded-md"
        style={{ animation: 'marshmallow-fade 1.4s infinite 0.2s' }}
      />
      <div
        className="h-4 w-4 bg-primary rounded-md"
        style={{ animation: 'marshmallow-fade 1.4s infinite 0.4s' }}
      />
    </div>
  );
};

export default Loader;
