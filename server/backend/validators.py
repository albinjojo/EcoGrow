import re

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$")


def validate_email(email: str) -> bool:
  return bool(email and EMAIL_RE.match(email))


def validate_password(password: str) -> bool:
  return bool(password and PASSWORD_RE.match(password))
