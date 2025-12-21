"""
Database connection pool for the Flask backend.

All credentials are pulled from environment variables; nothing is hard-coded.
Uses mysql-connector pooling for efficient reuse across requests.
"""

import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling

load_dotenv()


def get_pool():
	"""Create or return a shared MySQL connection pool."""
	return pooling.MySQLConnectionPool(
		pool_name="ecogrow_flask_pool",
		pool_size=int(os.environ.get("DB_POOL_SIZE", 5)),
		host=os.environ.get("DB_HOST", "127.0.0.1"),
		port=int(os.environ.get("DB_PORT", 3306)),
		user=os.environ.get("DB_USER"),
		password=os.environ.get("DB_PASSWORD"),
		database=os.environ.get("DB_NAME"),
		auth_plugin="mysql_native_password",
		charset="utf8mb4",
		use_unicode=True,
	)


pool = get_pool()


def get_connection():
	"""Get a pooled connection for request-scoped use."""
	return pool.get_connection()

