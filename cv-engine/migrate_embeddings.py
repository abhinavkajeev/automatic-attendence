#!/usr/bin/env python3
"""
Migration script to re-enroll all students with the improved face recognition system.
This script processes all student photos and generates new embeddings using face_recognition library.
"""
import os
import cv2
import pickle
import sys
from server import get_face_encoding_proper, compare_faces_proper

def migrate_embeddings(photos_dir='../client/public/models'):
    """Re-enroll all students from their photos"""
    
    print("=" * 70)
    print("Face Recognition Embeddings Migration")
    print("=" * 70)
    
    if not os.path.exists(photos_dir):
        print(f"❌ Photos directory not found: {photos_dir}")
        print("   Please provide the correct path to student photos.")
        return False
    
    # Get all image files
    image_files = [f for f in os.listdir(photos_dir) 
                   if f.endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        print(f"⚠️  No student photos found in: {photos_dir}")
        print("   Students need to be enrolled first.")
        return True
    
    print(f"\nFound {len(image_files)} student photos")
    print(f"Photos directory: {photos_dir}")
    print("-" * 70)
    
    new_embeddings = []
    new_student_ids = []
    processed_faces_dir = 'processed_faces'
    os.makedirs(processed_faces_dir, exist_ok=True)
    
    successful = 0
    failed = 0
    duplicates = 0
    
    for image_file in sorted(image_files):
        # Extract student ID from filename (assumes format: studentid.jpg)
        student_id = os.path.splitext(image_file)[0]
        image_path = os.path.join(photos_dir, image_file)
        
        print(f"\n📸 Processing: {image_file} (Student ID: {student_id})")
        
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            print(f"   ❌ Could not load image")
            failed += 1
            continue
        
        print(f"   Image size: {img.shape}")
        
        # Get face encoding using improved method
        result = get_face_encoding_proper(img)
        if result is None:
            print(f"   ❌ No face detected - skipping")
            failed += 1
            continue
        
        face_encoding, face_location = result
        top, right, bottom, left = face_location
        x, y, w, h = left, top, right - left, bottom - top
        
        print(f"   ✅ Face detected at location: ({x}, {y}, {w}, {h})")
        print(f"   Encoding: 128 dimensions")
        
        # Check for duplicates
        is_duplicate = False
        for i, existing_encoding in enumerate(new_embeddings):
            if compare_faces_proper(existing_encoding, face_encoding, tolerance=0.6):
                print(f"   ⚠️  Face matches existing student: {new_student_ids[i]}")
                is_duplicate = True
                duplicates += 1
                break
        
        if is_duplicate:
            print(f"   ⚠️  Skipping duplicate face")
            continue
        
        # Add to new embeddings
        new_embeddings.append(face_encoding)
        new_student_ids.append(student_id)
        
        # Save processed face image
        face_img = img[y:y+h, x:x+w]
        face_img_resized = cv2.resize(face_img, (200, 200))
        face_path = os.path.join(processed_faces_dir, f'{student_id}.jpg')
        cv2.imwrite(face_path, face_img_resized)
        
        print(f"   ✅ Enrolled successfully")
        successful += 1
    
    print("\n" + "=" * 70)
    print("Migration Results")
    print("=" * 70)
    print(f"✅ Successfully enrolled: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Duplicates detected: {duplicates}")
    print(f"📊 Total unique students: {len(new_embeddings)}")
    print("=" * 70)
    
    if new_embeddings:
        # Save new embeddings
        data = {
            'encodings': new_embeddings,
            'student_ids': new_student_ids
        }
        
        embeddings_file = 'student_embeddings.pkl'
        with open(embeddings_file, 'wb') as f:
            pickle.dump(data, f)
        
        print(f"\n✅ New embeddings saved to: {embeddings_file}")
        print(f"✅ Processed faces saved to: {processed_faces_dir}/")
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("  1. Start the server: python server.py")
        print("  2. Test face recognition with the /verify endpoint")
        print("  3. Students can now be recognized in live attendance")
    else:
        print("\n⚠️  No students enrolled. Please add student photos first.")
    
    return True

def main():
    # Check for custom photos directory
    photos_dir = '../client/public/models'
    if len(sys.argv) > 1:
        photos_dir = sys.argv[1]
    
    try:
        success = migrate_embeddings(photos_dir)
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

