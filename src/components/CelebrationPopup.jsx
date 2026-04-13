import React from 'react';

export default function CelebrationPopup({ isWinner, amount = 0, onClose }) {
  if (isWinner === undefined || isWinner === null) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h1 style={styles.title}>{isWinner ? 'VICTORY!' : 'YOU LOST'}</h1>

        {isWinner ? (
          <>
            <div style={styles.amount}>₹{amount}</div>
            <button style={styles.primaryButton} onClick={onClose}>
              COLLECT CASH & EXIT
            </button>
          </>
        ) : (
          <>
            <p style={styles.message}>Better luck next time</p>
            <button style={styles.secondaryButton} onClick={onClose}>
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '360px',
    background: '#1f1f1f',
    borderRadius: '24px',
    padding: '28px',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  title: {
    margin: 0,
    marginBottom: '20px',
    fontSize: '28px',
    fontWeight: 800,
    color: '#FFD700'
  },
  amount: {
    fontSize: '36px',
    fontWeight: 900,
    color: '#fff',
    marginBottom: '24px'
  },
  message: {
    margin: '0 0 24px',
    fontSize: '16px',
    color: '#ccc'
  },
  primaryButton: {
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    borderRadius: '18px',
    background: '#FFD700',
    color: '#000',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  secondaryButton: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '18px',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer'
  }
};