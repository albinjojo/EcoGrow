const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 20.6C4 17.3876 6.68629 14.8 10 14.8H14C17.3137 14.8 20 17.3876 20 20.6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

const NavigationBar = ({ userName = 'Account', onBack }) => {
  return (
    <header className="nav-bar">
      <button className="nav-back" type="button" onClick={onBack} aria-label="Go back">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 3.75L5.25 9L10.5 14.25" stroke="#1F1F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Back</span>
      </button>

      <div className="nav-spacer" aria-hidden />

      <div className="nav-user" aria-label="User account">
        <span className="nav-avatar" aria-hidden>
          <UserIcon />
        </span>
        <span className="nav-username">{userName}</span>
      </div>
    </header>
  )
}

export default NavigationBar
