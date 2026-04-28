import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    """Initialize Firebase App using the service account JSON from environment."""
    # If already initialized, return the existing app
    if firebase_admin._apps:
        return firebase_admin.get_app()
        
    service_account_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    
    if not service_account_env:
        print("Warning: FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase is not initialized.")
        return None

    try:
        # Load credentials from the JSON string
        cred_dict = json.loads(service_account_env)
        cred = credentials.Certificate(cred_dict)
        return firebase_admin.initialize_app(cred)
    except json.JSONDecodeError:
        print("Error: FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.")
        return None
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

# Initialize the app and get the Firestore client
app = initialize_firebase()

# Export the db instance
db = firestore.client() if app else None

def test_firestore_connection():
    """
    A simple test to verify Firestore connectivity.
    """
    if db is None:
        print("Firestore client is not available (not initialized).")
        return False
        
    try:
        # A lightweight operation: fetching the collections iterator
        # We try to fetch the first collection to trigger a network request
        collections = db.collections()
        next(collections, None) 
        
        print("Firestore connection test passed successfully.")
        return True
    except Exception as e:
        print(f"Firestore connection test failed: {e}")
        return False
