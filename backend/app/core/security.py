from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
import hashlib
import logging

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Configure CryptContext for password hashing
# Try using bcrypt, fallback to SHA-256 with salt if passlib encounters issues on Windows.
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception as e:
    logger.warning(f"Failed to initialize bcrypt via passlib: {e}. Falling back to SHA-256 for passwords.")
    pwd_context = None

def hash_password(password: str) -> str:
    """Hash password securely using bcrypt or SHA-256 fallback."""
    if pwd_context:
        try:
            return pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Bcrypt hash failed, running SHA-256 fallback: {e}")
    
    # Secure fallback hashing
    salt = settings.SECRET_KEY[:16]
    hashed = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000
    )
    return f"pbkdf2_sha256${100000}${salt}${hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password match."""
    if pwd_context and not hashed_password.startswith("pbkdf2_sha256$"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Bcrypt verification failed: {e}")
            
    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 4:
            iterations = int(parts[1])
            salt = parts[2]
            stored_hash = parts[3]
            hashed = hashlib.pbkdf2_hmac(
                'sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), iterations
            )
            return hashed.hex() == stored_hash
            
    # Check both ways as last resort
    fallback_hash = hash_password(plain_password)
    return fallback_hash == hashed_password

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
