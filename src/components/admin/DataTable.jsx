/**
 * DataTable component - Reusable table for displaying admin data
 * Supports columns, rows, and actions
 */
const DataTable = ({ columns, rows, actions }) => {
  return (
    <div className="data-table-container">
      <table className="simple-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && <th style={{ width: '120px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="empty-state">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="action-cell">
                    <div className="action-buttons">
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          className={`action-btn action-btn-${action.variant || 'primary'}`}
                          onClick={() => action.onClick(row)}
                          title={action.label}
                        >
                          {action.icon ? <span>{action.icon}</span> : action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
