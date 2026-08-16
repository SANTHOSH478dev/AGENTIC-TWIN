import sys
import os
import shutil

# Add root directory to python path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# If running on Vercel, copy pdt_twin.db to writable /tmp directory if needed
if os.getenv("VERCEL"):
    tmp_db = "/tmp/pdt_twin.db"
    src_db = os.path.join(root_dir, "pdt_twin.db")
    if not os.path.exists(tmp_db) and os.path.exists(src_db):
        try:
            shutil.copyfile(src_db, tmp_db)
        except Exception as e:
            print("DB Copy Notice:", e)

from backend.app.main import app
