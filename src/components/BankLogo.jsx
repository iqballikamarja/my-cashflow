import React from 'react';
import { Wallet } from 'lucide-react';

export default function BankLogo({ name, size = 32 }) {
  const bank = name.toUpperCase();
  
  let label = '';
  let color = '#333';
  
  if (bank.includes('BRI')) { label = 'BRI'; color = '#00529C'; }
  else if (bank.includes('BCA')) { label = 'BCA'; color = '#003399'; }
  else if (bank.includes('MANDIRI')) { label = 'mandiri'; color = '#003D79'; }
  else if (bank.includes('BSI')) { label = 'BSI'; color = '#00A59B'; }
  else if (bank.includes('BNI')) { label = 'BNI'; color = '#E65100'; }
  else if (bank.includes('DANA')) { label = 'DANA'; color = '#108EE9'; }
  else if (bank.includes('OVO')) { label = 'OVO'; color = '#4C2882'; }
  else if (bank.includes('GOPAY')) { label = 'gopay'; color = '#00880F'; }
  else if (bank.includes('SHOPEE')) { label = 'ShopeePay'; color = '#EE4D2D'; }

  if (label) {
    return (
      <div style={{ padding: '0 8px', height: size, background: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <span style={{ color: color, fontWeight: 900, fontSize: '1rem', fontStyle: label === 'mandiri' || label === 'gopay' ? 'italic' : 'normal', letterSpacing: '-0.5px' }}>{label}</span>
      </div>
    );
  }

  // Default fallback
  return (
    <div style={{ width: size, height: size, background: 'rgba(255,255,255,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Wallet size={size * 0.6} color="white" />
    </div>
  );
}
