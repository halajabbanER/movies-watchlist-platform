import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`toast-banner ${toast.isError ? 'error' : ''}`}>
      <span>{toast.isError ? '⚠️' : '✨'}</span>
      <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{toast.text}</span>
    </div>
  );
}

