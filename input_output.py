import os
import shutil

# 1. Define the path to your messy folder (Change this to your actual path)
# For Mac: '/Users/yourusername/Downloads'
# For Windows: 'C:/Users/yourusername/Downloads'
WATCHED_FOLDER = os.path.expanduser("~/Downloads")

# 2. Define your destination folders
DESTINATIONS = {
    ".pdf": "Documents",
    ".docx": "Documents",
    ".txt": "Documents",
    ".png": "Images",
    ".jpg": "Images",
    ".jpeg": "Images",
    ".py": "Code",
    ".zip": "Archives"
}

def organize_folder():
    # Loop through every file in the directory
    for filename in os.listdir(WATCHED_FOLDER):
        file_path = os.path.join(WATCHED_FOLDER, filename)
        
        # Skip if it's a directory, only look for files
        if os.path.isdir(file_path):
            continue
            
        # Get the file extension (e.g., '.pdf')
        _, extension = os.path.splitext(filename)
        extension = extension.lower()
        
        # Check if we have a defined folder for this extension
        if extension in DESTINATIONS:
            folder_name = DESTINATIONS[extension]
            target_folder = os.path.join(WATCHED_FOLDER, folder_name)
            
            # Create the folder if it doesn't exist yet
            if not os.path.exists(target_folder):
                os.makedirs(target_folder)
                print(f"Created folder: {folder_name}")
                
            # Move the file inside
            shutil.move(file_path, os.path.join(target_folder, filename))
            print(f"Moved: {filename} -> {folder_name}/")

if __name__ == "__main__":
    print("Starting file organization...")
    organize_folder()
    print("Done!")
