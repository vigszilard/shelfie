import { useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export default function ItemForm({ item, prefill, categories, onClose }) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? prefill?.name ?? '');
  const [quantity, setQuantity] = useState(item?.quantity ?? prefill?.quantity ?? 0);
  const [category, setCategory] = useState(item?.category ?? prefill?.category ?? '');
  const [barcode, setBarcode] = useState(item?.barcode ?? prefill?.barcode ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      quantity: Math.max(0, Number(quantity)),
      category: category.trim(),
      barcode: barcode.trim(),
      notes: notes.trim(),
      updatedAt: serverTimestamp(),
    };
    if (isEdit) {
      await updateDoc(doc(db, 'items', item.id), data);
    } else {
      await addDoc(collection(db, 'items'), { ...data, createdAt: serverTimestamp() });
    }
    onClose();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await deleteDoc(doc(db, 'items', item.id));
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit item' : 'Add item'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <label className="form-label">
            Name *
            <input
              autoFocus
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toilet Paper"
            />
          </label>

          <label className="form-label">
            Quantity
            <div className="qty-row">
              <button type="button" className="qty-btn qty-btn--minus" onClick={() => setQuantity((q) => Math.max(0, q - 1))}>−</button>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="qty-input"
              />
              <button type="button" className="qty-btn qty-btn--plus" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </label>

          <label className="form-label">
            Category
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Bathroom"
            />
            <datalist id="category-suggestions">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>

          <label className="form-label">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Costco 30-pack"
              rows={2}
            />
          </label>

          {barcode && (
            <p className="barcode-display">Barcode: {barcode}</p>
          )}

          <div className="form-actions">
            {isEdit && (
              <button
                type="button"
                className={`btn btn--danger ${confirmDelete ? 'btn--confirm' : ''}`}
                onClick={handleDelete}
                disabled={deleting}
              >
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
