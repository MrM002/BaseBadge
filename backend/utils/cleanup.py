"""
Utility script to clean up old CSV files while preserving wallet count statistics.
This script can be run periodically to free up disk space.
"""

import os
from pathlib import Path
from datetime import datetime, timedelta
import json
import shutil

def get_persistent_stats_file():
    """Get the path to the persistent stats file"""
    base_dir = Path(__file__).parent.parent.parent
    return base_dir / "data" / "persistent_stats.json"

def load_persistent_stats():
    """Load persistent stats from JSON file"""
    stats_file = get_persistent_stats_file()
    if stats_file.exists():
        try:
            with open(stats_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading persistent stats: {e}")
    return {
        "total_wallets_analyzed": 0,
        "last_updated": datetime.now().isoformat()
    }

def cleanup_old_csv_files(days_to_keep=7):
    """
    Clean up CSV files older than specified days while preserving wallet count.
    
    Args:
        days_to_keep (int): Number of days to keep CSV files (default: 7)
    """
    base_dir = Path(__file__).parent.parent.parent
    security_reports_dir = base_dir / "data" / "security_reports"
    
    if not security_reports_dir.exists():
        print("Security reports directory does not exist.")
        return
    
    # Load current persistent stats
    persistent_stats = load_persistent_stats()
    current_total = persistent_stats.get("total_wallets_analyzed", 0)
    
    print(f"Current total wallets analyzed: {current_total}")
    print(f"Cleaning up CSV files older than {days_to_keep} days...")
    
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    
    deleted_files = 0
    total_size_freed = 0
    
    for file_path in security_reports_dir.glob("*.csv"):
        try:
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            if file_time < cutoff_date:
                file_size = file_path.stat().st_size
                file_path.unlink()  # Delete the file
                deleted_files += 1
                total_size_freed += file_size
                print(f"Deleted: {file_path.name}")
                
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
    
    print(f"\nCleanup completed:")
    print(f"- Files deleted: {deleted_files}")
    print(f"- Space freed: {total_size_freed / 1024 / 1024:.2f} MB")
    print(f"- Total wallets analyzed (preserved): {current_total}")

def backup_csv_files(backup_days=30):
    """
    Create a backup of CSV files before deletion.
    
    Args:
        backup_days (int): Number of days to keep in backup (default: 30)
    """
    base_dir = Path(__file__).parent.parent.parent
    security_reports_dir = base_dir / "data" / "security_reports"
    backup_dir = base_dir / "data" / "backup_reports"
    
    if not security_reports_dir.exists():
        print("Security reports directory does not exist.")
        return
    
    # Create backup directory
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Calculate cutoff date for backup
    cutoff_date = datetime.now() - timedelta(days=backup_days)
    
    backed_up_files = 0
    
    for file_path in security_reports_dir.glob("*.csv"):
        try:
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            if file_time < cutoff_date:
                backup_path = backup_dir / file_path.name
                shutil.copy2(file_path, backup_path)
                backed_up_files += 1
                print(f"Backed up: {file_path.name}")
                
        except Exception as e:
            print(f"Error backing up file {file_path}: {e}")
    
    print(f"\nBackup completed: {backed_up_files} files backed up to {backup_dir}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean up old CSV files while preserving wallet count")
    parser.add_argument("--days", type=int, default=7, help="Number of days to keep CSV files (default: 7)")
    parser.add_argument("--backup", action="store_true", help="Create backup before deletion")
    parser.add_argument("--backup-days", type=int, default=30, help="Number of days to keep in backup (default: 30)")
    
    args = parser.parse_args()
    
    if args.backup:
        print("Creating backup...")
        backup_csv_files(args.backup_days)
        print()
    
    cleanup_old_csv_files(args.days) 