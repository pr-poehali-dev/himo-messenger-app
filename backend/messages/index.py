import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handles real-time messaging for HIM Messenger chats
    Args: event - dict with httpMethod, body containing message data
          context - object with request_id and other metadata 
    Returns: HTTP response with messages or message creation status
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
        dsn = os.environ.get('DATABASE_DSN', os.environ.get('DATABASE_URL', ''))
        if not dsn:
            raise Exception('Database connection not configured')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            # Get messages for a chat
            params = event.get('queryStringParameters', {}) or {}
            chat_id = params.get('chat_id')
            
            if not chat_id:
                return error_response('chat_id parameter required', 400)
            
            # Get messages with sender info
            cur.execute('''
                SELECT m.*, u.username, u.custom_id, u.is_premium, u.is_verified
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_id = %s
                ORDER BY m.created_at ASC
                LIMIT 100
            ''', (chat_id,))
            
            messages = [dict(row) for row in cur.fetchall()]
            
            return success_response({
                'messages': messages,
                'chat_id': chat_id
            })
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'send')
            
            if action == 'send':
                return handle_send_message(cur, conn, body_data)
            elif action == 'create_chat':
                return handle_create_chat(cur, conn, body_data)
            else:
                return error_response('Invalid action', 400)
        
        return error_response('Method not allowed', 405)
        
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def handle_send_message(cur, conn, body_data: Dict) -> Dict[str, Any]:
    '''Send a new message to chat'''
    chat_id = body_data.get('chat_id')
    sender_id = body_data.get('sender_id') 
    content = body_data.get('content', '').strip()
    
    if not all([chat_id, sender_id, content]):
        return error_response('chat_id, sender_id, and content are required', 400)
    
    # Insert message
    cur.execute('''
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES (%s, %s, %s)
        RETURNING id, chat_id, sender_id, content, created_at
    ''', (chat_id, sender_id, content))
    
    message = cur.fetchone()
    conn.commit()
    
    # Get sender info
    cur.execute('''
        SELECT username, custom_id, is_premium, is_verified
        FROM users WHERE id = %s
    ''', (sender_id,))
    sender = cur.fetchone()
    
    message_data = dict(message)
    if sender:
        message_data.update(dict(sender))
    
    return success_response({
        'message': message_data,
        'status': 'sent'
    })

def handle_create_chat(cur, conn, body_data: Dict) -> Dict[str, Any]:
    '''Create a new chat between users'''
    created_by = body_data.get('created_by')
    participants = body_data.get('participants', [])
    name = body_data.get('name', '')
    is_group = body_data.get('is_group', False)
    
    if not created_by:
        return error_response('created_by is required', 400)
    
    # For direct chats, check if chat already exists
    if not is_group and len(participants) == 2:
        cur.execute('''
            SELECT c.id FROM chats c
            WHERE NOT c.is_group
            AND EXISTS (SELECT 1 FROM chat_participants cp1 WHERE cp1.chat_id = c.id AND cp1.user_id = %s)
            AND EXISTS (SELECT 1 FROM chat_participants cp2 WHERE cp2.chat_id = c.id AND cp2.user_id = %s)
        ''', (participants[0], participants[1]))
        
        existing_chat = cur.fetchone()
        if existing_chat:
            return success_response({
                'chat_id': existing_chat['id'],
                'status': 'existing_chat'
            })
    
    # Create new chat
    cur.execute('''
        INSERT INTO chats (name, is_group, created_by)
        VALUES (%s, %s, %s)
        RETURNING id, name, is_group, created_at
    ''', (name, is_group, created_by))
    
    chat = cur.fetchone()
    conn.commit()
    
    return success_response({
        'chat': dict(chat),
        'status': 'created'
    })

def success_response(data: Dict) -> Dict[str, Any]:
    '''Return success response'''
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str)
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