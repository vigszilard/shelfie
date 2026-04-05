import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { hashPin } from '../lib/pinAuth';

export function useAuth() {
  const [verified, setVerified] = useState(
    () => sessionStorage.getItem('pinVerified') === 'true'
  );
  const [pinExists, setPinExists] = useState(null); // null = loading
  const [error, setError] = useState('');

  useEffect(() => {
    if (verified) return;
    getDoc(doc(db, 'config', 'pin')).then((snap) => {
      setPinExists(snap.exists());
    }).catch(() => setPinExists(false));
  }, [verified]);

  const verify = useCallback(async (pin) => {
    setError('');
    const hash = await hashPin(pin);
    const snap = await getDoc(doc(db, 'config', 'pin'));
    if (snap.exists() && snap.data().hash === hash) {
      sessionStorage.setItem('pinVerified', 'true');
      setVerified(true);
      return true;
    }
    setError('Wrong PIN. Try again.');
    return false;
  }, []);

  const setup = useCallback(async (pin) => {
    setError('');
    const hash = await hashPin(pin);
    await setDoc(doc(db, 'config', 'pin'), { hash });
    sessionStorage.setItem('pinVerified', 'true');
    setVerified(true);
  }, []);

  return { verified, pinExists, verify, setup, error };
}
