import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg z-10 dark:bg-gray-700">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
