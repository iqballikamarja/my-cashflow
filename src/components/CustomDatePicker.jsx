import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { id } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

export default function CustomDatePicker({ selected, onChange, required, className }) {
  // Fix styling issues with react-datepicker wrapper
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{`.react-datepicker-wrapper { width: 100%; display: block; } .react-datepicker__input-container { display: block; width: 100%; }`}</style>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd MMMM yyyy"
        locale={id}
        className={className || "form-input"}
        required={required}
      />
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
        <Calendar size={18} />
      </div>
    </div>
  );
}
