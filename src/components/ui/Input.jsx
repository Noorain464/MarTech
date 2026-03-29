import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', id, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <input id={id} type={type} className="input-field" {...props} />
    </div>
  );
};

export default Input;
