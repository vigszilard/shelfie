import { useState, useMemo } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import { useInventory } from './hooks/useInventory';
import PinScreen from './components/PinScreen';
import InventoryList from './components/InventoryList';
import ItemForm from './components/ItemForm';
import BarcodeScanner from './components/BarcodeScanner';

export default function App() {
  const { verified } = useAuth();
  const { items } = useInventory();
  const [screen, setScreen] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [prefill, setPrefill] = useState(null);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  );

  if (!verified) return <PinScreen />;

  function openAdd() { setPrefill(null); setScreen('add'); }
  function openEdit(item) { setEditItem(item); setScreen('edit'); }
  function openScan() { setScreen('scan'); }
  function closeModal() { setScreen(null); setEditItem(null); setPrefill(null); }

  function handleScanResult(result) {
    setScreen('add');
    setPrefill(result);
  }

  return (
    <>
      <InventoryList onAdd={openAdd} onEdit={openEdit} onScan={openScan} />

      {screen === 'scan' && (
        <BarcodeScanner onResult={handleScanResult} onClose={closeModal} />
      )}

      {(screen === 'add' || screen === 'edit') && (
        <ItemForm
          item={screen === 'edit' ? editItem : null}
          prefill={screen === 'add' ? prefill : null}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </>
  );
}
