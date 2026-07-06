import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from '../page.module.css';
import Button from '@/components/Button';

export default function PaymentSettings({ paymentSettings, onSaveSettings }) {
  const [formData, setFormData] = useState({
    currency: 'USD',
    expiryDays: 14,
    settlementNote: '',
    methods: {
      card: { enabled: true, label: '', provider: '', checkoutUrl: '', instructions: '' },
      bank: { enabled: true, label: '', accountName: '', bankName: '', accountNumber: '', iban: '', swift: '', instructions: '' },
      mobileMoney: { enabled: true, label: '', providers: '', contact: '', instructions: '' },
      crypto: { enabled: true, label: '', settlement: '', assets: [], instructions: '' }
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (paymentSettings) {
      setFormData(JSON.parse(JSON.stringify(paymentSettings)));
    }
  }, [paymentSettings]);

  const handleChange = (category, key, value) => {
    setFormData(prev => {
      if (!category) {
        return { ...prev, [key]: value };
      }
      return {
        ...prev,
        methods: {
          ...prev.methods,
          [category]: {
            ...prev.methods[category],
            [key]: value
          }
        }
      };
    });
  };

  const handleCryptoAssetChange = (index, field, value) => {
    setFormData(prev => {
      const newAssets = [...prev.methods.crypto.assets];
      newAssets[index] = { ...newAssets[index], [field]: value };
      return {
        ...prev,
        methods: {
          ...prev.methods,
          crypto: {
            ...prev.methods.crypto,
            assets: newAssets
          }
        }
      };
    });
  };

  const addCryptoAsset = () => {
    setFormData(prev => {
      const newAssets = [...prev.methods.crypto.assets, { asset: '', network: '', address: '' }];
      return {
        ...prev,
        methods: {
          ...prev.methods,
          crypto: {
            ...prev.methods.crypto,
            assets: newAssets
          }
        }
      };
    });
  };

  const removeCryptoAsset = (index) => {
    setFormData(prev => {
      const newAssets = prev.methods.crypto.assets.filter((_, i) => i !== index);
      return {
        ...prev,
        methods: {
          ...prev.methods,
          crypto: {
            ...prev.methods.crypto,
            assets: newAssets
          }
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg("Saving payment settings...");
    try {
      await onSaveSettings(formData);
      setStatusMsg("Payment settings saved successfully.");
    } catch (err) {
      setStatusMsg(`Error saving payment settings: ${err.message || "Failed"}`);
    }
    setIsSaving(false);
  };

  return (
    <div className={styles.settingsView}>
      <header className={styles.settingsHeader}>
        <h2>Payment Methods</h2>
        <p>Manage supported payment methods, instructions, and currency settings.</p>
        <div className={styles.settingsStatus}>{statusMsg}</div>
      </header>
      
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formSection}>
          <h3>Global Settings</h3>
          <div className={styles.grid2}>
            <label className={styles.formGroup}>
              Currency
              <input type="text" className={styles.inputField} value={formData.currency} onChange={(e) => handleChange(null, 'currency', e.target.value)} />
            </label>
            <label className={styles.formGroup}>
              Expiry Days
              <input type="number" className={styles.inputField} value={formData.expiryDays} onChange={(e) => handleChange(null, 'expiryDays', Number(e.target.value))} />
            </label>
            <label className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              Settlement Note
              <textarea className={styles.inputField} rows={2} value={formData.settlementNote} onChange={(e) => handleChange(null, 'settlementNote', e.target.value)} />
            </label>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Bank Transfer</h3>
          <label className={styles.checkboxRow} style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={formData.methods.bank.enabled} onChange={(e) => handleChange('bank', 'enabled', e.target.checked)} />
            <span>Enable Bank Transfer</span>
          </label>
          {formData.methods.bank.enabled && (
            <div className={styles.grid2}>
              <label className={styles.formGroup}>
                Bank Name
                <input type="text" className={styles.inputField} value={formData.methods.bank.bankName} onChange={(e) => handleChange('bank', 'bankName', e.target.value)} />
              </label>
              <label className={styles.formGroup}>
                Account Name
                <input type="text" className={styles.inputField} value={formData.methods.bank.accountName} onChange={(e) => handleChange('bank', 'accountName', e.target.value)} />
              </label>
              <label className={styles.formGroup}>
                Account Number
                <input type="text" className={styles.inputField} value={formData.methods.bank.accountNumber} onChange={(e) => handleChange('bank', 'accountNumber', e.target.value)} />
              </label>
              <label className={styles.formGroup}>
                IBAN
                <input type="text" className={styles.inputField} value={formData.methods.bank.iban} onChange={(e) => handleChange('bank', 'iban', e.target.value)} />
              </label>
              <label className={styles.formGroup}>
                SWIFT
                <input type="text" className={styles.inputField} value={formData.methods.bank.swift} onChange={(e) => handleChange('bank', 'swift', e.target.value)} />
              </label>
              <label className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                Instructions
                <textarea className={styles.inputField} rows={2} value={formData.methods.bank.instructions} onChange={(e) => handleChange('bank', 'instructions', e.target.value)} />
              </label>
            </div>
          )}
        </div>
        
        <div className={styles.formSection}>
          <h3>Card or Digital Wallet</h3>
          <label className={styles.checkboxRow} style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={formData.methods.card.enabled} onChange={(e) => handleChange('card', 'enabled', e.target.checked)} />
            <span>Enable Card / Wallet</span>
          </label>
          {formData.methods.card.enabled && (
            <div className={styles.grid2}>
              <label className={styles.formGroup}>
                Checkout URL
                <input type="text" className={styles.inputField} value={formData.methods.card.checkoutUrl} onChange={(e) => handleChange('card', 'checkoutUrl', e.target.value)} />
              </label>
              <label className={styles.formGroup}>
                Instructions
                <input type="text" className={styles.inputField} value={formData.methods.card.instructions} onChange={(e) => handleChange('card', 'instructions', e.target.value)} />
              </label>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: 0 }}>Cryptocurrency</h3>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formData.methods.crypto.enabled} onChange={(e) => handleChange('crypto', 'enabled', e.target.checked)} />
              <span>Enable Cryptocurrency</span>
            </label>
          </div>
          
          {formData.methods.crypto.enabled && (
            <div className={styles.grid2}>
              <label className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                General Instructions
                <textarea className={styles.inputField} rows={2} value={formData.methods.crypto.instructions} onChange={(e) => handleChange('crypto', 'instructions', e.target.value)} />
              </label>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '1.5rem 0 0.5rem', color: '#333' }}>Accepted Assets & Wallets</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
                  Add your exact receiving wallet addresses below.
                </p>

                {formData.methods.crypto.assets.map((asset, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: '0 0 100px' }}>
                      <input 
                        type="text" 
                        placeholder="Asset (e.g. USDT)" 
                        className={styles.inputField} 
                        value={asset.asset} 
                        onChange={(e) => handleCryptoAssetChange(index, 'asset', e.target.value)} 
                        required
                      />
                    </div>
                    <div style={{ flex: '0 0 120px' }}>
                      <input 
                        type="text" 
                        placeholder="Network (e.g. TRC20)" 
                        className={styles.inputField} 
                        value={asset.network} 
                        onChange={(e) => handleCryptoAssetChange(index, 'network', e.target.value)} 
                        required
                      />
                    </div>
                    <div style={{ flex: '1' }}>
                      <input 
                        type="text" 
                        placeholder="Wallet Address" 
                        className={styles.inputField} 
                        value={asset.address} 
                        onChange={(e) => handleCryptoAssetChange(index, 'address', e.target.value)} 
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeCryptoAsset(index)}
                      style={{ padding: '0.75rem', backgroundColor: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove asset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={addCryptoAsset}
                  style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                >
                  <Plus size={16} /> Add Asset Address
                </button>
              </div>
            </div>
          )}
        </div>
        
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save payment settings'}
        </Button>
      </form>
    </div>
  );
}
