import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function getCachedBarcode(barcode) {
  try {
    const snap = await getDoc(doc(db, 'barcodes', barcode));
    if (snap.exists()) return snap.data(); // { name, category }
  } catch {}
  return null;
}

export async function saveBarcode(barcode, name, category) {
  if (!barcode || !name) return;
  try {
    await setDoc(doc(db, 'barcodes', barcode), { name, category: category || '' });
  } catch {}
}
