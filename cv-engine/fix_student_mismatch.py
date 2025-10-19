#!/usr/bin/env python3
"""
Script to fix student ID mismatches between face recognition system and database
"""

import pickle
import os
import sys

def load_embeddings():
    """Load current embeddings"""
    if os.path.exists('student_embeddings.pkl'):
        with open('student_embeddings.pkl', 'rb') as f:
            return pickle.load(f)
    return {'encodings': [], 'student_ids': []}

def save_embeddings(data):
    """Save embeddings back to file"""
    with open('student_embeddings.pkl', 'wb') as f:
        pickle.dump(data, f)

def list_current_students():
    """List all students currently in the embeddings"""
    data = load_embeddings()
    print("Current students in face recognition system:")
    for i, student_id in enumerate(data['student_ids']):
        print(f"  {i}: Student ID {student_id}")
    return data

def remove_student(student_id):
    """Remove a specific student from embeddings"""
    data = load_embeddings()
    
    if student_id not in data['student_ids']:
        print(f"Student {student_id} not found in embeddings")
        return False
    
    # Find and remove the student
    index = data['student_ids'].index(student_id)
    data['student_ids'].pop(index)
    data['encodings'].pop(index)
    
    save_embeddings(data)
    print(f"Removed student {student_id} from face recognition system")
    return True

def update_student_id(old_id, new_id):
    """Update a student ID in the embeddings"""
    data = load_embeddings()
    
    if old_id not in data['student_ids']:
        print(f"Student {old_id} not found in embeddings")
        return False
    
    # Update the student ID
    index = data['student_ids'].index(old_id)
    data['student_ids'][index] = new_id
    
    save_embeddings(data)
    print(f"Updated student ID from {old_id} to {new_id}")
    return True

def main():
    print("=== Student ID Mismatch Fixer ===")
    print()
    
    # List current students
    data = list_current_students()
    print()
    
    if len(data['student_ids']) == 0:
        print("No students found in embeddings file")
        return
    
    print("Options:")
    print("1. Remove student 520 (if it's wrong)")
    print("2. Update student 520 to 555")
    print("3. List all students")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        remove_student("520")
    elif choice == "2":
        update_student_id("520", "555")
    elif choice == "3":
        list_current_students()
    elif choice == "4":
        print("Exiting...")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()
