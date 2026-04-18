
import React from 'react';

export const VietnamFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className={className}>
    <rect fill="#da251d" width="900" height="600"/>
    <path fill="#ff0" d="m450 113.3 84.3 259.4-220.4-160.3h272.2L365.7 372.7z"/>
  </svg>
);

export const UKFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={className}>
    <clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath>
    <clipPath id="b"><path d="M30 15h30v15zM0 0v15h30z"/></clipPath>
    <g clipPath="url(#a)">
      <path d="M0 0v30h60V0z" fill="#00247d"/>
      <path d="M0 0L60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/>
      <path d="M0 0L60 30m0-30L0 30" clipPath="url(#b)" stroke="#cf142b" strokeWidth="4"/>
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30 0v30M0 15h60" stroke="#cf142b" strokeWidth="6"/>
    </g>
  </svg>
);

export const JapanFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className={className}>
    <rect fill="#fff" width="900" height="600"/>
    <circle fill="#bc002d" cx="450" cy="300" r="180"/>
  </svg>
);

export const IndonesiaFlag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className={className}>
    <rect fill="#fff" width="900" height="600"/>
    <rect fill="#ce1126" width="900" height="300"/>
  </svg>
);
