import json
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handles user authentication (login/register) for HIM Messenger
    Args: event - dict with httpMethod, body containing username/password
          context - object with request_id and other metadata
    Returns: HTTP response with JWT token or error message
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Get database connection
    try:
        dsn = os.environ.get('DATABASE_DSN')
        if not dsn:
            raise Exception('DATABASE_DSN not found')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            username = body_data.get('username', '').strip()
            password = body_data.get('password', '')
            
            if action == 'register':
                return handle_register(cur, conn, username, password, body_data)
            elif action == 'login':
                return handle_login(cur, username, password)
            else:
                return error_response('Invalid action', 400)
        
        elif method == 'GET':
            # Verify token endpoint
            auth_header = event.get('headers', {}).get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
                user_data = verify_token(token)
                if user_data:
                    # Get fresh user data from database
                    cur.execute('SELECT * FROM users WHERE id = %s', (user_data['user_id'],))
                    user = cur.fetchone()
                    if user:
                        return success_response({
                            'user': dict(user),
                            'valid': True
                        })
                
            return error_response('Invalid token', 401)
        
        return error_response('Method not allowed', 405)
        
    except Exception as e:
        return error_response(f'Database error: {str(e)}', 500)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def handle_register(cur, conn, username: str, password: str, body_data: Dict) -> Dict[str, Any]:
    '''Register new user with validation'''
    email = body_data.get('email', '').strip()
    
    # Validation
    if len(username) < 3:
        return error_response('Username must be at least 3 characters', 400)
    if len(password) < 6:
        return error_response('Password must be at least 6 characters', 400)
    
    # Check if user exists
    cur.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
    if cur.fetchone():
        return error_response('Username or email already exists', 409)
    
    # Generate unique custom_id
    custom_id = generate_custom_id(cur)
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Insert user
    cur.execute('''
        INSERT INTO users (username, password_hash, custom_id, email, him_coins)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, username, custom_id, him_coins, is_premium, is_verified, is_admin
    ''', (username, password_hash, custom_id, email, 100))
    
    user = cur.fetchone()
    conn.commit()
    
    # Generate JWT token
    token = generate_token(user['id'], username)
    
    return success_response({
        'token': token,
        'user': dict(user),
        'message': 'Registration successful'
    })

def handle_login(cur, username: str, password: str) -> Dict[str, Any]:
    '''Login user with credentials'''
    # Get user by username
    cur.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    
    if not user:
        return error_response('Invalid username or password', 401)
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return error_response('Invalid username or password', 401)
    
    # Generate JWT token
    token = generate_token(user['id'], user['username'])
    
    # Remove password hash from response
    user_data = dict(user)
    del user_data['password_hash']
    
    return success_response({
        'token': token,
        'user': user_data,
        'message': 'Login successful'
    })

def generate_custom_id(cur) -> str:
    '''Generate unique custom ID for user'''
    import random
    import string
    
    while True:
        custom_id = 'USER' + ''.join(random.choices(string.digits, k=6))
        cur.execute('SELECT id FROM users WHERE custom_id = %s', (custom_id,))
        if not cur.fetchone():
            return custom_id

def generate_token(user_id: str, username: str) -> str:
    '''Generate JWT token for user'''
    secret = os.environ.get('JWT_SECRET', 'your-secret-key-here')
    payload = {
        'user_id': str(user_id),
        'username': username,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_token(token: str) -> Optional[Dict]:
    '''Verify JWT token and return payload'''
    try:
        secret = os.environ.get('JWT_SECRET', 'your-secret-key-here')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def success_response(data: Dict) -> Dict[str, Any]:
    '''Return success response'''
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }

def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    '''Return error response'''
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }