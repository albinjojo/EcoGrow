/**
 * FormField component - Reusable form input with label and error handling
 */
const FormField = ({ label, type = 'text', name, value, onChange, error, placeholder, required }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? 'form-input error' : 'form-input'}
          aria-invalid={Boolean(error)}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={error ? 'form-input error' : 'form-input'}
          aria-invalid={Boolean(error)}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {/* Options should be passed as children */}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? 'form-input error' : 'form-input'}
          aria-invalid={Boolean(error)}
        />
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default FormField
