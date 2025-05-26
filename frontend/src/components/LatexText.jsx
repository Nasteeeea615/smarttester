import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const LatexText = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/(&&.*?&&)/g);
  
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('&&') && part.endsWith('&&')) {
          const formula = part.slice(2, -2);
          return <InlineMath key={index} math={formula} />;
        }
        return part;
      })}
    </span>
  );
};

export default LatexText; 