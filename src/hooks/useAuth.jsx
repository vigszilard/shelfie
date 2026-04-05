import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { hashPin } from '../lib/pinAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [verified, setVerified] = useState(
    () => sessionStorage.getItem('pinVerified') === 'true'
  );
  const [pinExists, setPinExists] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (verified) return;
    getDoc(doc(db, 'config', 'pin'))
      .then((snap) => setPinExists(snap.exists()))
      .catch(() => setPinExists(false));
  }, [verified]);

  const verify = useCallback(async (pin) => {
    setError('');
    try {
      const hash = await hashPin(pin);
      const snap = await getDoc(doc(db, 'config', 'pin'));
      if (snap.exists() && snap.data().hash === hash) {
        sessionStorage.setItem('pinVerified', 'true');
        setVerified(true);
        return true;
      }
      setError('Wrong PIN. Try again.');
      return false;
    } catch (e) {
      setError('Connection error. Try again.');
      return false;
    }
  }, []);

  const setup = useCallback(async (pin) => {
    setError('');
    try {
      const hash = await hashPin(pin);
      await setDoc(doc(db, 'config', 'pin'), { hash });
      sessionStorage.setItem('pinVerified', 'true');
      setVerified(true);
    } catch (e) {
      setError('Could not save PIN. Check your connection.');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ verified, pinExists, verify, setup, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
