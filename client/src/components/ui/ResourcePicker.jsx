import React from 'react';
import { MOCK_CUSTOMERS, MOCK_PRODUCT_VARIANTS } from '../../lib/mocks';
import { Select } from './Select';

/**
 * ResourcePicker
 * Clean picker for Customers and Product Variants.
 * 
 * TODO: Replace with backend search/select API once dedicated customer
 * and product variant endpoints are implemented in the Express backend.
 */
export function ResourcePicker({
  type = 'customer', // 'customer' | 'variant'
  value,
  onChange,
  label,
  error,
  placeholder = 'Select...',
  disabled = false,
  className,
}) {
  const isCustomer = type === 'customer';
  const options = isCustomer ? MOCK_CUSTOMERS : MOCK_PRODUCT_VARIANTS;

  return (
    <Select
      label={label || (isCustomer ? 'Customer Account' : 'Product Line / Variant')}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
      className={className}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((item) => (
        <option key={item._id} value={item._id}>
          {item.name} {isCustomer ? `(${item.email})` : `• $${item.default_price} [${item.sku}]`}
        </option>
      ))}
    </Select>
  );
}

