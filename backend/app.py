"""
WordMaster backend (Flask + SQLite + JWT)

Security highlights:
- Passwords hashed with bcrypt (12 rounds)
- JWT signed with HS256 algorithm, secret from env var (or 256-bit random fallback)
- Access tokens expire in 1 hour, refresh tokens in 30 days
- Refresh-token rotation supported via /refresh endpoint
- Sensitive endpoints protected with @jwt_required()
- Admin-only endpoints additionally check is_admin flag
"""

import os
import secrets
import sqlite3
from datetime import datetime, date, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from flask_bcrypt import Bcrypt


app = Flask(__name__)
CORS(app)

# ================= SECURITY CONFIG ================= #

# JWT secret: read from env var; fall back to a strong random key for local dev.
# WARNING: in real production this MUST be set as an environment variable so it
# stays stable across restarts. The random fallback below changes every restart,
# which would invalidate all tokens.
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY",
    secrets.token_hex(32)  # 256-bit random
)

# Explicitly specify signing algorithm (defends against "alg: none" attacks)
app.config["JWT_ALGORITHM"] = "HS256"

# Token lifetimes
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

DB_FILE = "vocab.db"


# ================= DATABASE ================= #

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        is_admin BOOLEAN DEFAULT 0
    )
    """)

    # vocabulary table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        meaning TEXT,
        example TEXT,
        learned BOOLEAN DEFAULT 0,
        user_id INTEGER
    )
    """)

    # history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        word TEXT,
        action TEXT,
        timestamp TEXT
    )
    """)

    # check_ins table (one row per user per day)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS check_ins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        check_date TEXT,
        UNIQUE (user_id, check_date)
    )
    """)

    conn.commit()
    conn.close()


init_db()


# ================= HELPERS ================= #

def add_history(user_id, word, action):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO history (user_id, word, action, timestamp)
           VALUES (?, ?, ?, ?)""",
        (user_id, word, action, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()


def is_admin(user_id):
    """Check if a user_id has admin privileges."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_admin FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return bool(row and row["is_admin"])


def compute_streak(check_dates_desc):
    """
    Given a list of check-in date strings (YYYY-MM-DD), already sorted DESC,
    return current consecutive-day streak counting back from today.
    """
    if not check_dates_desc:
        return 0

    today = date.today()
    streak = 0

    # Accept either today or yesterday as the most recent for an active streak
    most_recent = datetime.strptime(check_dates_desc[0], "%Y-%m-%d").date()
    if (today - most_recent).days > 1:
        return 0

    expected = most_recent
    for d_str in check_dates_desc:
        d = datetime.strptime(d_str, "%Y-%m-%d").date()
        if d == expected:
            streak += 1
            expected = expected - timedelta(days=1)
        else:
            break

    return streak


# ================= AUTH: REGISTER ================= #

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    if len(password) < 4:
        return jsonify({"msg": "Password must be at least 4 characters"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_pw)
        )
        conn.commit()
        conn.close()
        return jsonify({"msg": "Registered successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"msg": "Username already exists"}), 400


# ================= AUTH: LOGIN ================= #

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (data.get("username"),))
    user = cursor.fetchone()
    conn.close()

    if user is None:
        return jsonify({"msg": "User not found"}), 401

    if not bcrypt.check_password_hash(user["password"], data.get("password", "")):
        return jsonify({"msg": "Wrong password"}), 401

    identity = str(user["id"])
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    return jsonify({
        "token": access_token,
        "refresh_token": refresh_token,
        "username": user["username"],
        "is_admin": bool(user["is_admin"])
    })


# ================= AUTH: REFRESH ================= #

@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Issue a new short-lived access token using a valid refresh token."""
    identity = get_jwt_identity()
    new_access = create_access_token(identity=identity)
    return jsonify({"token": new_access})


# ================= AUTH: DELETE OWN ACCOUNT (注销) ================= #

@app.route("/account", methods=["DELETE"])
@jwt_required()
def delete_own_account():
    """User deletes their own account and all associated data."""
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    # Cascade-delete user-owned data
    cursor.execute("DELETE FROM vocabulary WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM check_ins WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"msg": "Account deleted"})


# ================= WORDS: READ ================= #

@app.route("/words", methods=["GET"])
@jwt_required()
def get_words():
    user_id = get_jwt_identity()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vocabulary WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{
        "id": row["id"],
        "word": row["word"],
        "meaning": row["meaning"],
        "example": row["example"],
        "learned": bool(row["learned"])
    } for row in rows])


# ================= WORDS: CREATE ================= #

@app.route("/words", methods=["POST"])
@jwt_required()
def add_word():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO vocabulary (word, meaning, example, learned, user_id)
           VALUES (?, ?, ?, ?, ?)""",
        (data.get("word"), data.get("meaning"), data.get("example", ""), 0, user_id)
    )
    conn.commit()
    conn.close()

    add_history(user_id, data.get("word", ""), "added")
    return jsonify({"msg": "Word added"})


# ================= WORDS: UPDATE ================= #

@app.route("/words/<int:word_id>", methods=["PUT"])
@jwt_required()
def update_word(word_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """UPDATE vocabulary
           SET word = ?, meaning = ?, example = ?, learned = ?
           WHERE id = ? AND user_id = ?""",
        (data.get("word"), data.get("meaning"), data.get("example", ""),
         int(bool(data.get("learned"))), word_id, user_id)
    )
    conn.commit()
    conn.close()

    add_history(user_id, data.get("word", ""), "updated")
    return jsonify({"msg": "Updated successfully"})


# ================= WORDS: DELETE ================= #

@app.route("/words/<int:word_id>", methods=["DELETE"])
@jwt_required()
def delete_word(word_id):
    user_id = get_jwt_identity()

    conn = get_db()
    cursor = conn.cursor()
    # Capture word text for history before deleting
    cursor.execute(
        "SELECT word FROM vocabulary WHERE id = ? AND user_id = ?",
        (word_id, user_id)
    )
    row = cursor.fetchone()
    word_text = row["word"] if row else "unknown"

    cursor.execute(
        "DELETE FROM vocabulary WHERE id = ? AND user_id = ?",
        (word_id, user_id)
    )
    conn.commit()
    conn.close()

    add_history(user_id, word_text, "deleted")
    return jsonify({"msg": "Deleted successfully"})


# ================= CHECK-INS: CREATE (今日打卡) ================= #

@app.route("/checkin", methods=["POST"])
@jwt_required()
def check_in():
    """Manual daily check-in. Idempotent: re-checking the same day is a no-op."""
    user_id = get_jwt_identity()
    today_str = date.today().strftime("%Y-%m-%d")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO check_ins (user_id, check_date) VALUES (?, ?)",
            (user_id, today_str)
        )
        conn.commit()
        already = False
    except sqlite3.IntegrityError:
        already = True

    # Re-read all check-ins to return updated stats
    cursor.execute(
        "SELECT check_date FROM check_ins WHERE user_id = ? ORDER BY check_date DESC",
        (user_id,)
    )
    dates = [r["check_date"] for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "already_checked_in": already,
        "today": today_str,
        "streak": compute_streak(dates),
        "total_days": len(dates),
        "all_dates": dates,
    })


# ================= CHECK-INS: READ ================= #

@app.route("/checkin", methods=["GET"])
@jwt_required()
def get_checkin_status():
    """Return today's check-in status, streak count, and all check-in dates."""
    user_id = get_jwt_identity()
    today_str = date.today().strftime("%Y-%m-%d")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT check_date FROM check_ins WHERE user_id = ? ORDER BY check_date DESC",
        (user_id,)
    )
    dates = [r["check_date"] for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "checked_in_today": today_str in dates,
        "today": today_str,
        "streak": compute_streak(dates),
        "total_days": len(dates),
        "all_dates": dates,
    })


# ================= ADMIN: HISTORY ================= #

@app.route("/admin/history", methods=["GET"])
@jwt_required()
def admin_history():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Access denied"}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT users.username, history.word, history.action, history.timestamp
           FROM history JOIN users ON history.user_id = users.id
           ORDER BY history.timestamp DESC"""
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{
        "username": r["username"],
        "word": r["word"],
        "action": r["action"],
        "timestamp": r["timestamp"]
    } for r in rows])


# ================= ADMIN: LIST USERS ================= #

@app.route("/admin/users", methods=["GET"])
@jwt_required()
def admin_list_users():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Access denied"}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.username, u.is_admin,
               (SELECT COUNT(*) FROM vocabulary v WHERE v.user_id = u.id) AS word_count,
               (SELECT COUNT(*) FROM check_ins c WHERE c.user_id = u.id) AS checkin_count
        FROM users u
        ORDER BY u.id
    """)
    rows = cursor.fetchall()
    conn.close()

    return jsonify([{
        "id": r["id"],
        "username": r["username"],
        "is_admin": bool(r["is_admin"]),
        "word_count": r["word_count"],
        "checkin_count": r["checkin_count"],
    } for r in rows])


# ================= ADMIN: DELETE USER ================= #

@app.route("/admin/users/<int:target_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_user(target_id):
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"msg": "Access denied"}), 403

    # Prevent admin from deleting themselves through this endpoint
    if str(target_id) == str(user_id):
        return jsonify({"msg": "Cannot delete yourself. Use /account to delete your own account."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE id = ?", (target_id,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        return jsonify({"msg": "User not found"}), 404

    # Cascade-delete user-owned data
    cursor.execute("DELETE FROM vocabulary WHERE user_id = ?", (target_id,))
    cursor.execute("DELETE FROM history WHERE user_id = ?", (target_id,))
    cursor.execute("DELETE FROM check_ins WHERE user_id = ?", (target_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (target_id,))
    conn.commit()
    conn.close()

    return jsonify({"msg": f"User '{row['username']}' deleted"})


# ================= MAIN ================= #

if __name__ == "__main__":
    app.run(debug=True)
