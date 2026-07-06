import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import Button from '@/components/Button';
import { formatDateTime } from '../utils';

export default function FeeSettings({ feeSettings, onSaveSettings }) {
  const [formData, setFormData] = useState({
    roleRates: {
      SURGEON: 0,
      ANESTHESIOLOGIST: 0,
      NURSE_ANESTHETIST: 0,
      ER_PHYSICIAN: 0,
      TRAUMA_NURSE: 0,
      PEDIATRICIAN: 0,
      OBGYN: 0,
      MIDWIFE: 0,
      INFECTIOUS_DISEASE: 0,
      LOGISTICIAN: 0
    },
    zoneMultipliers: {
      LEVEL_1: 0,
      LEVEL_2: 0,
      LEVEL_3: 0
    },
    handover: 0,
    travelCoordination: 0,
    reservePercent: 0
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (feeSettings) {
      setFormData({
        roleRates: { ...feeSettings.roleRates },
        zoneMultipliers: { ...feeSettings.zoneMultipliers },
        handover: feeSettings.handover || 0,
        travelCoordination: feeSettings.travelCoordination || 0,
        reservePercent: feeSettings.reservePercent || 0
      });
    }
  }, [feeSettings]);

  const handleChange = (category, key, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: category === 'root' ? value : {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg("Saving fee table...");
    try {
      await onSaveSettings(formData);
      setStatusMsg("Fee table saved successfully.");
    } catch (err) {
      setStatusMsg("Error saving fee table.");
    }
    setIsSaving(false);
  };

  return (
    <div className={styles.settingsView}>
      <header className={styles.settingsHeader}>
        <h2>Fee Operations</h2>
        <p>Update base rates, risk multipliers, and fixed costs used in the cost calculator.</p>
        <div className={styles.settingsStatus}>{statusMsg}</div>
        <div className={styles.settingsMeta}>
          Last updated: {feeSettings?.updatedAt ? formatDateTime(feeSettings.updatedAt) : 'Loading...'}
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formSection}>
          <h3>Base Role Rates (USD/day)</h3>
          <div className={styles.grid2}>
            {Object.keys(formData.roleRates).map(role => (
              <label key={role} className={styles.formGroup}>
                {role.replace('_', ' ')}
                <input 
                  type="number" 
                  className={styles.inputField} 
                  value={formData.roleRates[role]} 
                  onChange={(e) => handleChange('roleRates', role, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Zone Multipliers (Percent addition)</h3>
          <div className={styles.grid2}>
            {Object.keys(formData.zoneMultipliers).map(zone => (
              <label key={zone} className={styles.formGroup}>
                {zone.replace('_', ' ')}
                <input 
                  type="number" 
                  className={styles.inputField} 
                  value={formData.zoneMultipliers[zone]} 
                  onChange={(e) => handleChange('zoneMultipliers', zone, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Fixed & Variable Costs</h3>
          <div className={styles.grid2}>
            <label className={styles.formGroup}>
              Handover Briefing (USD)
              <input 
                type="number" 
                className={styles.inputField} 
                value={formData.handover} 
                onChange={(e) => handleChange('root', 'handover', Number(e.target.value))}
              />
            </label>
            <label className={styles.formGroup}>
              Travel Coordination (USD)
              <input 
                type="number" 
                className={styles.inputField} 
                value={formData.travelCoordination} 
                onChange={(e) => handleChange('root', 'travelCoordination', Number(e.target.value))}
              />
            </label>
            <label className={styles.formGroup}>
              Operational Reserve (%)
              <input 
                type="number" 
                className={styles.inputField} 
                value={formData.reservePercent} 
                onChange={(e) => handleChange('root', 'reservePercent', Number(e.target.value))}
              />
            </label>
          </div>
        </div>
        
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save fee table'}
        </Button>
      </form>
    </div>
  );
}
