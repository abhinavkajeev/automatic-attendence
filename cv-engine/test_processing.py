#!/usr/bin/env python3
"""
Test script to verify the updated image processing logic
"""

import os
import requests
import json

def test_process_uploads():
    """Test the /process-uploads endpoint"""
    try:
        url = "http://127.0.0.1:5001/process-uploads"
        response = requests.post(url)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: process-uploads endpoint working!")
            print(f"📊 Results:")
            print(f"   • Initial enrolled: {result.get('initial_enrolled_count', 'N/A')}")
            print(f"   • Final enrolled: {result.get('final_enrolled_count', 'N/A')}")
            print(f"   • Newly enrolled: {result.get('newly_enrolled', 'N/A')}")
            print(f"   • Current students: {result.get('current_students', [])}")
        else:
            print(f"❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ CONNECTION ERROR: {str(e)}")
        print("Make sure the server is running on http://127.0.0.1:5001")

def test_debug_embeddings():
    """Test the /debug-embeddings endpoint"""
    try:
        url = "http://127.0.0.1:5001/debug-embeddings"
        response = requests.get(url)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS: debug-embeddings endpoint working!")
            print(f"📊 Enrollment Status:")
            print(f"   • Total students: {result.get('encodings_count', 'N/A')}")
            print(f"   • Student IDs: {result.get('student_ids', [])}")
        else:
            print(f"\n❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ CONNECTION ERROR: {str(e)}")

def check_directories():
    """Check the status of upload and processed directories"""
    print("\n📁 Directory Status:")
    
    uploads_dir = "uploads/students"
    processed_dir = "processed_faces"
    
    if os.path.exists(uploads_dir):
        upload_files = [f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"   • uploads/students: {len(upload_files)} files")
        print(f"     Files: {upload_files}")
    else:
        print(f"   • uploads/students: Directory not found")
    
    if os.path.exists(processed_dir):
        processed_files = [f for f in os.listdir(processed_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"   • processed_faces: {len(processed_files)} files")
        print(f"     Files: {processed_files}")
        
        # Show which files need processing
        if os.path.exists(uploads_dir):
            upload_ids = [os.path.splitext(f)[0] for f in upload_files]
            processed_ids = [os.path.splitext(f)[0] for f in processed_files]
            
            missing = [uid for uid in upload_ids if uid not in processed_ids]
            if missing:
                print(f"   • Files needing processing: {missing}")
            else:
                print(f"   • All upload files have been processed ✅")
    else:
        print(f"   • processed_faces: Directory not found")

if __name__ == "__main__":
    print("🔍 Testing Updated Image Processing Logic")
    print("=" * 50)
    
    # Check directories first
    check_directories()
    
    # Test endpoints
    test_process_uploads()
    test_debug_embeddings()
    
    print("\n" + "=" * 50)
    print("✅ Test completed!")