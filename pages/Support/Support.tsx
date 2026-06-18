import React from 'react';
import SupportChat from '../../src/components/SupportChat.tsx';

interface SupportProps {
  onBack: () => void;
}

export default function Support({ onBack }: SupportProps) {
  return (
    <div className="h-full">
      <SupportChat onBack={onBack} />
    </div>
  );
}
