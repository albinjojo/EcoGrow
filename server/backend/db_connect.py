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
		pool_size=int(os.environ.get("DB_POOL_SIZE", 15)),
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
	"""Get a pooled connection for request-scoped use and force UTC session time zone."""
	conn = pool.get_connection()
	cur = conn.cursor()
	cur.execute("SET time_zone = '+00:00'")
	cur.close()
	return conn

from flask import Blueprint, request, jsonify

crop_api_bp = Blueprint('crop_api_bp', __name__)

def save_crop(user_id, name):
	conn = get_connection()
	try:
		cur = conn.cursor()
		cur.execute("INSERT INTO crops (user_id, name) VALUES (%s, %s)", (user_id, name))
		conn.commit()
		crop_id = cur.lastrowid
		cur.close()
		return crop_id
	finally:
		conn.close()

def save_crop_threshold(crop_id, stage, parameter, min_value, max_value, unit):
	conn = get_connection()
	try:
		cur = conn.cursor()
		cur.execute("""
			INSERT INTO crop_thresholds (crop_id, stage, parameter, min_value, max_value, unit)
			VALUES (%s, %s, %s, %s, %s, %s)
		""", (crop_id, stage, parameter, min_value, max_value, unit))
		conn.commit()
		threshold_id = cur.lastrowid
		cur.close()
		return threshold_id
	finally:
		conn.close()

def get_user_crops(user_id):
	conn = get_connection()
	try:
		cur = conn.cursor(dictionary=True)
		cur.execute("SELECT id, name FROM crops WHERE user_id = %s", (user_id,))
		rv = cur.fetchall()
		cur.close()
		return rv
	finally:
		conn.close()

def get_crop_thresholds(crop_id):
	conn = get_connection()
	try:
		cur = conn.cursor(dictionary=True)
		cur.execute("SELECT id, stage, parameter, min_value, max_value, unit FROM crop_thresholds WHERE crop_id = %s", (crop_id,))
		rv = cur.fetchall()
		cur.close()
		return rv
	finally:
		conn.close()

@crop_api_bp.route('/api/crops', methods=['POST'])
def api_add_crop():
	data = request.json
	try:
		crop_id = save_crop(data['user_id'], data['name'])
		return jsonify({"message": "success", "id": crop_id}), 201
	except Exception as e:
		return jsonify({"error": str(e)}), 500

@crop_api_bp.route('/api/crops/<int:user_id>', methods=['GET'])
def api_get_crops(user_id):
	try:
		return jsonify(get_user_crops(user_id))
	except Exception as e:
		return jsonify({"error": str(e)}), 500

@crop_api_bp.route('/api/thresholds', methods=['POST'])
def api_add_threshold():
	data = request.json
	try:
		t_id = save_crop_threshold(data['crop_id'], data['stage'], data['parameter'], data['min_value'], data['max_value'], data['unit'])
		return jsonify({"message": "success", "id": t_id}), 201
	except Exception as e:
		return jsonify({"error": str(e)}), 500

@crop_api_bp.route('/api/thresholds/<int:crop_id>', methods=['GET'])
def api_get_thresholds(crop_id):
	try:
		return jsonify(get_crop_thresholds(crop_id))
	except Exception as e:
		return jsonify({"error": str(e)}), 500
